import { db } from "@/lib/firebase";
import {
    doc,
    getDoc,
    setDoc,
    collection,
    query,
    where,
    getDocs,
    deleteDoc,
    runTransaction,
    serverTimestamp
} from "firebase/firestore";
import { TeamRegistration, SoloRegistration, TeamMember, categories, EventItem } from "@/data/constant";

export interface UserRegistrations {
    soloEvents: string[]; // Event Titles
    teamEvents: TeamRegistration[];
    totalCount: number;
}

// --- Helper Functions ---

const getEventDetails = (eventTitle: string): EventItem | undefined => {
    const allItems = categories.flatMap((cat) => cat.items);
    return allItems.find((item) => item.title === eventTitle);
};

export const checkRegistrationStatus = async (eventTitle: string): Promise<{ isClosed: boolean }> => {
    if (!db) return { isClosed: false };
    try {
        const settingsRef = doc(db, "event_settings", eventTitle);
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists()) {
            return { isClosed: settingsSnap.data().isClosed || false };
        }
        return { isClosed: false };
    } catch (error) {
        console.error("Error checking registration status:", error);
        return { isClosed: false };
    }
};

export const fetchAllEventSettings = async (): Promise<Record<string, boolean>> => {
    if (!db) return {};
    try {
        const settingsRef = collection(db, "event_settings");
        const settingsSnap = await getDocs(settingsRef);
        const settings: Record<string, boolean> = {};
        settingsSnap.forEach(doc => {
            settings[doc.id] = doc.data().isClosed || false;
        });
        return settings;
    } catch (error) {
        console.error("Error fetching all event settings:", error);
        return {};
    }
};

// Validate rules
export const validateRegistrationRules = (
    existingSoloEvents: string[],
    existingTeamEvents: TeamRegistration[],
    targetSoloEvents: string[] | null,
    newTeamEventTitle?: string
): { valid: boolean; message?: string } => {
    const finalSoloEvents = targetSoloEvents !== null ? targetSoloEvents : existingSoloEvents;
    const finalTeamEvents = existingTeamEvents.map(t => t.eventTitle);
    if (newTeamEventTitle) finalTeamEvents.push(newTeamEventTitle);

    // Filter out duplicates (user should not be able to double-register anyway)
    const allEventTitles = Array.from(new Set([...finalSoloEvents, ...finalTeamEvents]));

    let offStageCount = 0;
    let onStageIndCount = 0;
    let onStageGroupCount = 0;
    const datesMap: Record<string, string[]> = {};

    allEventTitles.forEach((title) => {
        const event = getEventDetails(title);
        if (!event) return;

        if (event.categoryType === 'off_stage') {
            offStageCount++;
        } else if (event.categoryType === 'on_stage' || event.categoryType === 'flagship') {
            if (event.eventType === 'individual') {
                onStageIndCount++;
            } else {
                onStageGroupCount++;
            }
        }

        if (event.date) {
            if (!datesMap[event.date]) datesMap[event.date] = [];
            datesMap[event.date].push(event.title);
        }
    });

    // Validate 1 event per day rule
    for (const [date, events] of Object.entries(datesMap)) {
        if (events.length > 1) {
            return {
                valid: false,
                message: `Schedule Conflict: You are already registered for "${events[0]}" on ${date}. Participation is limited to one event per day.`
            };
        }
    }

    if (offStageCount > 4) return { valid: false, message: `Limit Reached: Maximum of 4 Off-Stage events allowed. Current selection: ${offStageCount}.` };
    if (onStageIndCount > 3) return { valid: false, message: `Limit Reached: Maximum of 3 Individual On-Stage events allowed. Current selection: ${onStageIndCount}.` };
    if (onStageGroupCount > 2) return { valid: false, message: `Limit Reached: Maximum of 2 Group events allowed. Current selection: ${onStageGroupCount}.` };

    return { valid: true };
};

// --- Main Service Functions ---

export const fetchUserRegistrations = async (uid: string): Promise<UserRegistrations> => {
    if (!db || !uid) return { soloEvents: [], teamEvents: [], totalCount: 0 };
    const firestore = db;

    try {
        const soloDocRef = doc(firestore, "registrations", uid);
        const soloDoc = await getDoc(soloDocRef);
        let soloEvents: string[] = [];
        let cachedTeamEvents: string[] = [];

        if (soloDoc.exists()) {
            const data = soloDoc.data() as SoloRegistration;
            soloEvents = data.events || [];
            cachedTeamEvents = data.teamEvents || [];
        }

        const teamsRef = collection(firestore, "teams");
        const q = query(teamsRef, where("memberIds", "array-contains", uid));
        const querySnapshot = await getDocs(q);
        const teamEvents: TeamRegistration[] = [];
        const actualTeamEventTitles: string[] = [];

        querySnapshot.forEach((doc) => {
            const teamData = doc.data() as TeamRegistration;
            teamEvents.push({ id: doc.id, ...teamData });
            if (teamData.eventTitle) {
                actualTeamEventTitles.push(teamData.eventTitle);
            }
        });

        const cachedSet = new Set(cachedTeamEvents);
        const actualSet = new Set(actualTeamEventTitles);

        let needsUpdate = false;
        if (cachedSet.size !== actualSet.size) needsUpdate = true;
        else {
            for (const t of actualSet) {
                if (!cachedSet.has(t)) {
                    needsUpdate = true;
                    break;
                }
            }
        }

        if (needsUpdate) {
            try {
                await setDoc(soloDocRef, {
                    userId: uid,
                    teamEvents: actualTeamEventTitles,
                    lastUpdated: new Date().toISOString()
                }, { merge: true });
            } catch (err) {
                console.error("Failed to auto-heal registrations:", err);
            }
        }

        return { soloEvents, teamEvents, totalCount: soloEvents.length + teamEvents.length };
    } catch (error) {
        console.error("Error fetching registrations:", error);
        return { soloEvents: [], teamEvents: [], totalCount: 0 };
    }
};

const getRegId = (eventTitle: string, userId: string) => `${eventTitle.replace(/\s+/g, '_')}_${userId}`;

export const createTeam = async (
    leaderUid: string,
    leaderName: string,
    leaderEmail: string,
    eventTitle: string,
    members: TeamMember[]
): Promise<{ success: boolean; message?: string }> => {
    if (!db || !leaderUid) return { success: false, message: "System Error or Not Logged In" };
    const firestore = db;

    try {
        const status = await checkRegistrationStatus(eventTitle);
        if (status.isClosed) return { success: false, message: "Registration is closed for this event." };

        const allMemberIds = [leaderUid, ...members.map(m => m.uid).filter(uid => uid !== leaderUid)];
        const uniqueMemberIds = Array.from(new Set(allMemberIds));

        return await runTransaction(firestore, async (transaction) => {
            const teamCounterRef = doc(firestore, "counters", `team_${eventTitle}`);
            const teamCounterDoc = await transaction.get(teamCounterRef);

            const globalCounterRef = doc(firestore, "counters", "user_chest_numbers");
            let globalCounterDoc = await transaction.get(globalCounterRef);
            let currentGlobalCount = globalCounterDoc.exists() ? (globalCounterDoc.data().count || 0) : 0;

            const userChestNoMap: { [uid: string]: string | null } = {};
            const memberChestNoUpdates: { [uid: string]: string } = {};
            const finalMemberChestNos: { [uid: string]: string } = {};
            const regDocsMap: { [uid: string]: any } = {};
            let leaderHouse: string | null = null;

            for (const uid of uniqueMemberIds) {
                const userDocRef = doc(firestore, "users", uid);
                const userDoc = await transaction.get(userDocRef);

                if (!userDoc.exists()) {
                    throw new Error(`Profile not found for ${uid}. Complete profile first.`);
                }

                const userData = userDoc.data();
                if (!userData.name || !userData.department || !userData.collegeId || !userData.mobile || !userData.house) {
                    throw new Error(`Profile incomplete for ${userData.name || uid}. Please ensure house and mobile are updated.`);
                }

                // Capture leader's house or validate member's house matches leader's
                if (uid === leaderUid) {
                    leaderHouse = userData.house;
                } else if (leaderHouse && userData.house !== leaderHouse) {
                    throw new Error(`House Mismatch: All team members must belong to the same house. ${userData.name} belongs to ${userData.house} while you belong to ${leaderHouse}.`);
                }

                if (userData.chestNo) {
                    userChestNoMap[uid] = userData.chestNo;
                } else {
                    userChestNoMap[uid] = null;
                }

                const regDocRef = doc(firestore, "registrations", uid);
                const regDoc = await transaction.get(regDocRef);
                regDocsMap[uid] = regDoc;

                let currentSoloEvents: string[] = [];
                let currentTeamEvents: string[] = [];

                if (regDoc.exists()) {
                    const data = regDoc.data() as SoloRegistration;
                    currentSoloEvents = data.events || [];
                    currentTeamEvents = data.teamEvents || [];
                }

                if (currentSoloEvents.includes(eventTitle) || currentTeamEvents.includes(eventTitle)) {
                    const memberName = members.find(m => m.uid === uid)?.name || (uid === leaderUid ? "You" : "A member");
                    throw new Error(`${memberName} is already registered.`);
                }

                const mockTeamRegs = currentTeamEvents.map(t => ({ eventTitle: t } as TeamRegistration));
                const validation = validateRegistrationRules(currentSoloEvents, mockTeamRegs, null, eventTitle);

                if (!validation.valid) {
                    const memberName = members.find(m => m.uid === uid)?.name || (uid === leaderUid ? "You" : "A member");
                    throw new Error(`${memberName}: ${validation.message}`);
                }
            }

            const eventInfo = getEventDetails(eventTitle);
            if (!eventInfo) throw new Error("Event not found");

            if (members.length < (eventInfo.minParticipants || 1)) throw new Error("Too few members");

            for (const uid of uniqueMemberIds) {
                if (userChestNoMap[uid]) {
                    finalMemberChestNos[uid] = userChestNoMap[uid] as string;
                } else {
                    let isUnique = false;
                    while (!isUnique) {
                        currentGlobalCount++;
                        const candidate = (100 + currentGlobalCount).toString().padStart(3, '0');
                        const userQuery = query(collection(firestore, "users"), where("chestNo", "==", candidate));
                        const querySnap = await getDocs(userQuery);
                        const chestNoLockRef = doc(firestore, "taken_chest_numbers", candidate);
                        const chestNoLockDoc = await transaction.get(chestNoLockRef);

                        if (querySnap.empty && !chestNoLockDoc.exists()) {
                            finalMemberChestNos[uid] = candidate;
                            memberChestNoUpdates[uid] = candidate;
                            isUnique = true;
                        }
                    }
                }
            }

            const teamCount = teamCounterDoc.exists() ? (teamCounterDoc.data().count || 0) : 0;
            const newTeamCount = teamCount + 1;
            const shortCode = eventInfo.shortCode || "GRP";
            const teamChestNo = `${shortCode}${(100 + newTeamCount).toString().padStart(3, '0')}`;

            if (Object.keys(memberChestNoUpdates).length > 0) {
                transaction.set(globalCounterRef, { count: currentGlobalCount }, { merge: true });
            }

            for (const [uid, newNo] of Object.entries(memberChestNoUpdates)) {
                const userDocRef = doc(firestore, "users", uid);
                transaction.set(userDocRef, { chestNo: newNo }, { merge: true });
                const chestNoLockRef = doc(firestore, "taken_chest_numbers", newNo);
                transaction.set(chestNoLockRef, { uid, createdAt: serverTimestamp() });
            }

            for (const uid of uniqueMemberIds) {
                const regDocRef = doc(firestore, "registrations", uid);
                const regDoc = regDocsMap[uid];
                transaction.set(regDocRef, {
                    userId: uid,
                    teamEvents: [...(regDoc.exists() ? ((regDoc.data() as SoloRegistration).teamEvents || []) : []), eventTitle],
                    lastUpdated: new Date().toISOString()
                }, { merge: true });
            }

            transaction.set(teamCounterRef, { count: newTeamCount }, { merge: true });

            const newTeamRef = doc(collection(firestore, "teams"));
            const teamData = {
                id: newTeamRef.id,
                eventId: eventTitle,
                eventTitle: eventTitle,
                leaderId: leaderUid,
                members: members,
                memberIds: members.map(m => m.uid),
                status: "confirmed",
                teamChestNo: teamChestNo,
                createdAt: new Date().toISOString()
            };
            transaction.set(newTeamRef, teamData);

            const regId = getRegId(eventTitle, newTeamRef.id);
            const regRef = doc(firestore, "event_registrations", regId);
            transaction.set(regRef, {
                type: 'team',
                teamId: newTeamRef.id,
                eventTitle: eventTitle,
                leaderId: leaderUid,
                teamChestNo: teamChestNo,
                leaderChestNo: finalMemberChestNos[leaderUid],
                memberChestNos: finalMemberChestNos,
                memberIds: members.map(m => m.uid),
                registeredAt: serverTimestamp()
            });

            return { success: true };
        });

    } catch (error: any) {
        console.error("Error creating team:", error);
        return { success: false, message: error.message || "Failed to join team." };
    }
};

export const updateUserSoloRegistrations = async (uid: string, newEvents: string[]): Promise<{ success: boolean; message?: string }> => {
    if (!db || !uid) return { success: false, message: "System Error" };
    const firestore = db;

    try {
        return await runTransaction(firestore, async (transaction) => {
            const soloDocRef = doc(firestore, "registrations", uid);
            const soloDoc = await transaction.get(soloDocRef);

            const currentData = soloDoc.exists() ? (soloDoc.data() as SoloRegistration) : null;
            const currentEvents = currentData?.events || [];
            const currentTeamEvents = currentData?.teamEvents || [];

            const added = newEvents.filter(e => !currentEvents.includes(e));
            const removed = currentEvents.filter(e => !newEvents.includes(e));

            for (const eventTitle of added) {
                const status = await checkRegistrationStatus(eventTitle);
                if (status.isClosed) throw new Error(`Registration closed for ${eventTitle}.`);

                // Extra check: Is it already a team event?
                if (currentTeamEvents.includes(eventTitle)) {
                    throw new Error(`Already registered for ${eventTitle} in a team.`);
                }
            }

            const mockTeamRegs = currentTeamEvents.map(t => ({ eventTitle: t } as TeamRegistration));
            const validation = validateRegistrationRules(currentEvents, mockTeamRegs, newEvents, undefined);

            if (!validation.valid) throw new Error(validation.message);

            const userDocRef = doc(firestore, "users", uid);
            const userDoc = await transaction.get(userDocRef);

            if (!userDoc.exists()) throw new Error("Profile not found.");

            const userData = userDoc.data();
            if (!userData.name || !userData.department || !userData.collegeId || !userData.mobile) {
                throw new Error("Profile incomplete.");
            }

            let userChestNo = userData.chestNo || null;
            let globalCounterRef = doc(firestore, "counters", "user_chest_numbers");
            let currentGlobalCount = 0;

            if (!userChestNo && added.length > 0) {
                const globalCounterDoc = await transaction.get(globalCounterRef);
                currentGlobalCount = globalCounterDoc.exists() ? (globalCounterDoc.data().count || 0) : 0;

                let isUnique = false;
                while (!isUnique) {
                    currentGlobalCount++;
                    const candidate = (100 + currentGlobalCount).toString().padStart(3, '0');
                    const userQuery = query(collection(firestore, "users"), where("chestNo", "==", candidate));
                    const querySnap = await getDocs(userQuery);
                    const chestNoLockRef = doc(firestore, "taken_chest_numbers", candidate);
                    const chestNoLockDoc = await transaction.get(chestNoLockRef);

                    if (querySnap.empty && !chestNoLockDoc.exists()) {
                        userChestNo = candidate;
                        isUnique = true;
                    }
                }
            }

            if (!userData.chestNo && added.length > 0) {
                transaction.set(globalCounterRef, { count: currentGlobalCount }, { merge: true });
                transaction.set(userDocRef, { chestNo: userChestNo }, { merge: true });
                if (userChestNo) {
                    const chestNoLockRef = doc(firestore, "taken_chest_numbers", userChestNo);
                    transaction.set(chestNoLockRef, { uid, createdAt: serverTimestamp() });
                }
            }

            for (const eventTitle of removed) {
                const regId = getRegId(eventTitle, uid);
                transaction.delete(doc(firestore, "event_registrations", regId));
            }

            for (const eventTitle of added) {
                const regId = getRegId(eventTitle, uid);
                transaction.set(doc(firestore, "event_registrations", regId), {
                    type: 'individual',
                    userId: uid,
                    userChestNo: userChestNo,
                    eventTitle: eventTitle,
                    registeredAt: serverTimestamp()
                });
            }

            transaction.set(soloDocRef, {
                userId: uid,
                events: newEvents,
                lastUpdated: new Date().toISOString()
            }, { merge: true });

            return { success: true };
        });

    } catch (error: any) {
        console.error("Error updating registrations:", error);
        return { success: false, message: error.message || "Update failed." };
    }
};

export const leaveTeam = async (uid: string, teamId: string): Promise<{ success: boolean; message?: string }> => {
    if (!db) return { success: false, message: "Database not initialized" };
    const firestore = db;
    try {
        await runTransaction(firestore, async (transaction) => {
            const teamDocRef = doc(firestore, "teams", teamId);
            const teamDoc = await transaction.get(teamDocRef);
            if (!teamDoc.exists()) throw new Error("Team not found");

            const teamData = teamDoc.data() as TeamRegistration;
            if (teamData.leaderId !== uid) throw new Error("Only the leader can delete.");

            const memberIds = teamData.memberIds || [];
            for (const memberId of memberIds) {
                const regDocRef = doc(firestore, "registrations", memberId);
                const regDoc = await transaction.get(regDocRef);
                if (regDoc.exists()) {
                    const data = regDoc.data() as SoloRegistration;
                    const updatedTeamEvents = (data.teamEvents || []).filter(t => t !== teamData.eventTitle);
                    if (updatedTeamEvents.length !== (data.teamEvents || []).length) {
                        transaction.set(regDocRef, { teamEvents: updatedTeamEvents }, { merge: true });
                    }
                }
            }

            transaction.delete(teamDocRef);
            const regId = getRegId(teamData.eventTitle, teamId);
            transaction.delete(doc(firestore, "event_registrations", regId));
        });

        return { success: true, message: "Team disbanded successfully." };
    } catch (error: any) {
        console.error("Error leaving team:", error);
        return { success: false, message: error.message || "Failed to leave team." };
    }
};

export const toggleSoloEvent = async (uid: string, eventTitle: string, isSelected: boolean): Promise<{ success: boolean; message?: string }> => {
    return { success: false, message: "Use batch update" };
};
export const getMyRegistrations = async (userId: string) => {
    const registrations = await fetchUserRegistrations(userId);
    return registrations;
};
