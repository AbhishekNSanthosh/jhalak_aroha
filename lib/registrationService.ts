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

// Validate rules (no changes to logic, just context)
export const validateRegistrationRules = (
    existingSoloEvents: string[],
    existingTeamEvents: TeamRegistration[],
    targetSoloEvents: string[] | null,
    newTeamEventTitle?: string
): { valid: boolean; message?: string } => {
    const finalSoloEvents = targetSoloEvents !== null ? targetSoloEvents : existingSoloEvents;
    const finalTeamEvents = existingTeamEvents.map(t => t.eventTitle);
    if (newTeamEventTitle) finalTeamEvents.push(newTeamEventTitle);

    let offStageCount = 0;
    let onStageIndCount = 0;
    let onStageGroupCount = 0;

    const processEvent = (title: string) => {
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
    };

    if (finalSoloEvents) finalSoloEvents.forEach(processEvent);
    finalTeamEvents.forEach(processEvent);

    if (offStageCount > 4) return { valid: false, message: `Maximum 4 Off-Stage events allowed. You selected ${offStageCount}.` };
    if (onStageIndCount > 3) return { valid: false, message: `Maximum 3 Individual On-Stage events allowed. You selected ${onStageIndCount}.` };
    if (onStageGroupCount > 2) return { valid: false, message: `Maximum 2 Group items allowed. You selected ${onStageGroupCount}.` };

    return { valid: true };
};

// --- Main Service Functions ---

export const fetchUserRegistrations = async (uid: string): Promise<UserRegistrations> => {
    if (!db || !uid) return { soloEvents: [], teamEvents: [], totalCount: 0 };
    const firestore = db;

    try {
        // 1. Fetch Solo Registrations
        const soloDocRef = doc(firestore, "registrations", uid);
        const soloDoc = await getDoc(soloDocRef);
        let soloEvents: string[] = [];
        if (soloDoc.exists()) {
            soloEvents = (soloDoc.data() as SoloRegistration).events || [];
        }

        // 2. Fetch Team Registrations
        const teamsRef = collection(firestore, "teams");
        const q = query(teamsRef, where("memberIds", "array-contains", uid));
        const querySnapshot = await getDocs(q);
        const teamEvents: TeamRegistration[] = [];
        querySnapshot.forEach((doc) => {
            teamEvents.push({ id: doc.id, ...doc.data() } as TeamRegistration);
        });

        return { soloEvents, teamEvents, totalCount: soloEvents.length + teamEvents.length };
    } catch (error) {
        console.error("Error fetching registrations:", error);
        return { soloEvents: [], teamEvents: [], totalCount: 0 };
    }
};


// --- Chest Number & Transaction Logic ---

// Helper to generating chest number doc ID: "eventTitle_userId"
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
        return await runTransaction(firestore, async (transaction) => {
            // ==========================================
            // 1. ALL READS & PRE-VALIDATION
            // ==========================================

            // Read Team Counter
            const teamCounterRef = doc(firestore, "counters", `team_${eventTitle}`);
            const teamCounterDoc = await transaction.get(teamCounterRef);

            // Read Global User Counter
            const globalCounterRef = doc(firestore, "counters", "user_chest_numbers");
            let globalCounterDoc = await transaction.get(globalCounterRef);
            let currentGlobalCount = globalCounterDoc.exists() ? (globalCounterDoc.data().count || 0) : 0;

            // Collect all unique member IDs
            const allMemberIds = [leaderUid, ...members.map(m => m.uid).filter(uid => uid !== leaderUid)];
            const uniqueMemberIds = Array.from(new Set(allMemberIds));

            // Read User Docs
            const userChestNoMap: { [uid: string]: string | null } = {};
            for (const uid of uniqueMemberIds) {
                const userDocRef = doc(firestore, "users", uid);
                const userDoc = await transaction.get(userDocRef);
                if (userDoc.exists() && userDoc.data().chestNo) {
                    userChestNoMap[uid] = userDoc.data().chestNo;
                } else {
                    userChestNoMap[uid] = null;
                }
            }

            const eventInfo = getEventDetails(eventTitle);
            if (!eventInfo) throw new Error("Event not found");

            // ==========================================
            // 2. LOGIC & CALCULATIONS
            // ==========================================
            if (members.length < (eventInfo.minParticipants || 1)) throw new Error("Too few members");

            // Calculate Chest Numbers
            const memberChestNoUpdates: { [uid: string]: string } = {};
            const finalMemberChestNos: { [uid: string]: string } = {};

            // Assign numbers based on pre-fetched map
            for (const uid of uniqueMemberIds) {
                if (userChestNoMap[uid]) {
                    finalMemberChestNos[uid] = userChestNoMap[uid] as string;
                } else {
                    // Assign new number
                    currentGlobalCount++;
                    const newChestNo = currentGlobalCount.toString().padStart(3, '0');
                    finalMemberChestNos[uid] = newChestNo;
                    memberChestNoUpdates[uid] = newChestNo;
                }
            }

            // Generate Team Chest Number
            const teamCount = teamCounterDoc.exists() ? (teamCounterDoc.data().count || 0) : 0;
            const newTeamCount = teamCount + 1;
            const shortCode = eventInfo.shortCode || "GRP";
            const teamChestNo = `${shortCode}${(100 + newTeamCount).toString().padStart(3, '0')}`;

            // ==========================================
            // 3. ALL WRITES
            // ==========================================

            // A. Update Global User Check Number Counter (if any new user numbers assigned)
            if (Object.keys(memberChestNoUpdates).length > 0) {
                transaction.set(globalCounterRef, { count: currentGlobalCount }, { merge: true });
            }

            // B. Update User Docs with new chest numbers
            // B. Update User Docs with new chest numbers
            for (const [uid, newNo] of Object.entries(memberChestNoUpdates)) {
                // Only update the leader's document to avoid permission errors
                // as normal users cannot update other users' documents.
                // The chest number is still recorded in the event registration.
                if (uid === leaderUid) {
                    const userDocRef = doc(firestore, "users", uid);
                    transaction.set(userDocRef, { chestNo: newNo }, { merge: true });
                }
            }

            // C. Update Team Counter
            transaction.set(teamCounterRef, { count: newTeamCount }, { merge: true });

            // D. Create Team Doc
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

            // E. Create Admin Registration Doc
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
            // 1. ALL READS
            const soloDocRef = doc(firestore, "registrations", uid);
            const soloDoc = await transaction.get(soloDocRef);
            const currentEvents = soloDoc.exists() ? ((soloDoc.data() as SoloRegistration).events || []) : [];

            // Identify Added and Removed
            const added = newEvents.filter(e => !currentEvents.includes(e));
            const removed = currentEvents.filter(e => !newEvents.includes(e));

            if (added.length === 0 && removed.length === 0) return { success: true };

            // Read User Doc if chest number is needed
            const userDocRef = doc(firestore, "users", uid);
            const userDoc = await transaction.get(userDocRef);
            let userChestNo = userDoc.exists() ? userDoc.data().chestNo : null;

            // Read Global User Counter if user has no chest number and needs one (i.e. adding events)
            let globalCounterRef = doc(firestore, "counters", "user_chest_numbers");
            let globalCounterDoc = null;
            let currentGlobalCount = 0;

            if (!userChestNo && added.length > 0) {
                globalCounterDoc = await transaction.get(globalCounterRef);
                currentGlobalCount = globalCounterDoc.exists() ? (globalCounterDoc.data().count || 0) : 0;

                // Calculate new chest number
                currentGlobalCount++;
                userChestNo = currentGlobalCount.toString().padStart(3, '0');
            }

            // 3. WRITES
            // Update User & Counter if new chest number assigned
            if ((!userDoc.exists() || !userDoc.data().chestNo) && added.length > 0) {
                transaction.set(globalCounterRef, { count: currentGlobalCount }, { merge: true });
                transaction.set(userDocRef, { chestNo: userChestNo }, { merge: true });
            }

            // Handle Removed (Undo)
            for (const eventTitle of removed) {
                const regId = getRegId(eventTitle, uid);
                const regRef = doc(firestore, "event_registrations", regId);
                transaction.delete(regRef);
            }

            // Handle Added
            for (const eventTitle of added) {
                // Create Admin Registration Doc
                const regId = getRegId(eventTitle, uid);
                const regRef = doc(firestore, "event_registrations", regId);
                transaction.set(regRef, {
                    type: 'individual',
                    userId: uid,
                    userChestNo: userChestNo,
                    eventTitle: eventTitle,
                    registeredAt: serverTimestamp()
                });
            }

            // Update User's Main Registration Doc
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
        // We can do this as a transaction or simple batch.
        // Logic: Get Team -> If leader, delete Team Doc AND event_registration doc.

        await runTransaction(firestore, async (transaction) => {
            const teamDocRef = doc(firestore, "teams", teamId);
            const teamDoc = await transaction.get(teamDocRef);
            if (!teamDoc.exists()) throw new Error("Team not found");

            const teamData = teamDoc.data() as TeamRegistration;

            if (teamData.leaderId !== uid) {
                // If not leader, and just leaving (feature maybe not fully used yet, but logic exists)
                // If implementing 'member leaving', we would update the array.
                // Current UI implies 'Disband' for leader.
                throw new Error("Only the leader can delete the team.");
            }

            // Leader Disbanding
            transaction.delete(teamDocRef);

            // Delete Admin Registration
            const regId = getRegId(teamData.eventTitle, teamId);
            const regRef = doc(firestore, "event_registrations", regId);
            transaction.delete(regRef);
        });

        return { success: true, message: "Team disbanded successfully." };
    } catch (error: any) {
        console.error("Error leaving team:", error);
        return { success: false, message: error.message || "Failed to leave team." };
    }
};

// Toggle Solo Event (Deprecated wrapper)
export const toggleSoloEvent = async (uid: string, eventTitle: string, isSelected: boolean): Promise<{ success: boolean; message?: string }> => {
    return { success: false, message: "Use batch update" };
};
