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
        // 1. Fetch Solo Registrations (and cached team events)
        const soloDocRef = doc(firestore, "registrations", uid);
        const soloDoc = await getDoc(soloDocRef);
        let soloEvents: string[] = [];
        let cachedTeamEvents: string[] = [];

        if (soloDoc.exists()) {
            const data = soloDoc.data() as SoloRegistration;
            soloEvents = data.events || [];
            cachedTeamEvents = data.teamEvents || [];
        }

        // 2. Fetch Team Registrations (Source of Truth)
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

        // 3. Self-Healing: Sync if mismatch
        // We only care if cached has MORE than actual (blocking registration) or LESS (allowing over-registration)
        // But simply syncing to actual is best.
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
            console.log(`[Auto-Fix] Syncing team events for ${uid}. Cached: ${cachedTeamEvents.length}, Actual: ${actualTeamEventTitles.length}`);
            // Fire and forget update (or await if critical, but Fire/Forget is better for UX speed, 
            // though for immediate sequential actions await might be safer. Let's await to be safe.)
            try {
                await setDoc(soloDocRef, {
                    userId: uid, // Ensure field exists
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


// --- Chest Number & Transaction Logic ---

// --- Chest Number & Transaction Logic ---

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
        const status = await checkRegistrationStatus(eventTitle);
        if (status.isClosed) return { success: false, message: "Registration is closed for this event." };

        // --- PRE-TRANSACTION VALIDATION (Still useful for fast fail) ---
        // We do a quick check, but the REAL check is inside the transaction now.
        // Keeping the pre-check to avoid unnecessary transaction retries if obviously invalid.
        const allMemberIds = [leaderUid, ...members.map(m => m.uid).filter(uid => uid !== leaderUid)];
        const uniqueMemberIds = Array.from(new Set(allMemberIds));

        // ... existing pre-check logic can remain or be removed. 
        // For efficiency, let's keep it as "Optimistic Validation".
        // (Logic omitted to save tokens, assuming user is okay with just strict transactional check or we include it if needed. 
        // Actually, reducing code duplication: let's rely on the Transaction for the Definitive Truth.)

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

            // Read User Docs & Registration Docs (For Locking & Validation)
            const userChestNoMap: { [uid: string]: string | null } = {};
            const memberChestNoUpdates: { [uid: string]: string } = {};
            const finalMemberChestNos: { [uid: string]: string } = {};
            const regDocsMap: { [uid: string]: any } = {}; // Store regDoc snapshots for later use

            // We iterate and READ everything first.
            for (const uid of uniqueMemberIds) {
                // A. Read User Profile (for Chest No)
                const userDocRef = doc(firestore, "users", uid);
                const userDoc = await transaction.get(userDocRef);

                if (!userDoc.exists()) {
                    throw new Error(`User profile not found for member ID ${uid}. Please ensure all members have completed their profile.`);
                }

                const userData = userDoc.data();
                if (!userData.name || !userData.department || !userData.collegeId || !userData.mobile) {
                    throw new Error(`Profile incomplete for member ${userData.name || uid}. Please ask them to complete their profile (including mobile number).`);
                }

                if (userData.chestNo) {
                    userChestNoMap[uid] = userData.chestNo;
                } else {
                    userChestNoMap[uid] = null;
                }

                // B. Read User Registrations (For Atomic Validation)
                const regDocRef = doc(firestore, "registrations", uid);
                const regDoc = await transaction.get(regDocRef);
                regDocsMap[uid] = regDoc; // Store for later use in write phase

                let currentSoloEvents: string[] = [];
                let currentTeamEvents: string[] = [];

                if (regDoc.exists()) {
                    const data = regDoc.data() as SoloRegistration;
                    currentSoloEvents = data.events || [];
                    currentTeamEvents = data.teamEvents || [];
                }

                // --- ATOMIC VALIDATION ---
                // 1. Check if already registered for THIS event
                if (currentSoloEvents.includes(eventTitle) || currentTeamEvents.includes(eventTitle)) {
                    const memberName = members.find(m => m.uid === uid)?.name || (uid === leaderUid ? "You" : "A member");
                    throw new Error(`${memberName} came too late! Already registered for ${eventTitle}.`);
                }

                // 2. Validate Limits (Simulated TeamRegistration list for validator)
                // We construct mock TeamRegistration objects because validator expects them.
                const mockTeamRegs = currentTeamEvents.map(t => ({ eventTitle: t } as TeamRegistration));

                const validation = validateRegistrationRules(
                    currentSoloEvents,
                    mockTeamRegs,
                    null,
                    eventTitle
                );

                if (!validation.valid) {
                    const memberName = members.find(m => m.uid === uid)?.name || (uid === leaderUid ? "You" : "A member");
                    throw new Error(`${memberName}: ${validation.message}`);
                }
            }

            const eventInfo = getEventDetails(eventTitle);
            if (!eventInfo) throw new Error("Event not found");

            // ==========================================
            // 2. LOGIC & CALCULATIONS
            // ==========================================
            if (members.length < (eventInfo.minParticipants || 1)) throw new Error("Too few members");

            // Assign numbers starting from 101
            // Assign numbers starting from 101
            for (const uid of uniqueMemberIds) {
                if (userChestNoMap[uid]) {
                    finalMemberChestNos[uid] = userChestNoMap[uid] as string;
                } else {
                    let isUnique = false;
                    while (!isUnique) {
                        currentGlobalCount++;
                        const candidate = (100 + currentGlobalCount).toString().padStart(3, '0');

                        // Check uniqueness against existing users (Legacy)
                        const userQuery = query(collection(firestore, "users"), where("chestNo", "==", candidate));
                        const querySnap = await getDocs(userQuery);

                        // Check uniqueness against lock collection (Transactional)
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

            // Generate Team Chest Number
            const teamCount = teamCounterDoc.exists() ? (teamCounterDoc.data().count || 0) : 0;
            const newTeamCount = teamCount + 1;
            const shortCode = eventInfo.shortCode || "GRP";
            const teamChestNo = `${shortCode}${(100 + newTeamCount).toString().padStart(3, '0')}`;

            // ==========================================
            // 3. ALL WRITES
            // ==========================================

            // A. Update Global User Check Number Counter ok
            if (Object.keys(memberChestNoUpdates).length > 0) {
                transaction.set(globalCounterRef, { count: currentGlobalCount }, { merge: true });
            }

            // B. Update User Docs with new chest numbers AND Lock the number
            for (const [uid, newNo] of Object.entries(memberChestNoUpdates)) {
                const userDocRef = doc(firestore, "users", uid);
                transaction.set(userDocRef, { chestNo: newNo }, { merge: true });

                // Create Lock Doc
                const chestNoLockRef = doc(firestore, "taken_chest_numbers", newNo);
                transaction.set(chestNoLockRef, { uid, createdAt: serverTimestamp() });
            }

            // C. Update Member Registration Docs (Add Team Event)
            // Use the regDocsMap that was populated during the read phase (line 184)
            for (const uid of uniqueMemberIds) {
                const regDocRef = doc(firestore, "registrations", uid);
                const regDoc = regDocsMap[uid]; // Use the snapshot from the read phase

                transaction.set(regDocRef, {
                    userId: uid,
                    teamEvents: [...(regDoc.exists() ? ((regDoc.data() as SoloRegistration).teamEvents || []) : []), eventTitle],
                    lastUpdated: new Date().toISOString()
                }, { merge: true });
            }

            // D. Update Team Counter
            transaction.set(teamCounterRef, { count: newTeamCount }, { merge: true });

            // E. Create Team Doc
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

            // F. Create Admin Registration Doc
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
        // Pre-validation for Closed Events (Optimistic)
        for (const eventTitle of newEvents) {
            const status = await checkRegistrationStatus(eventTitle);
            if (status.isClosed) {
                // Logic to allow existing... handled better inside transaction or by checking current state first.
                // Let's do a quick read for UX, but strict check in transaction? 
                // Actually this function REPLACES all solo events, so "keeping" means it's in newEvents.
                // We just need to check if we are ADDING a closed event.
                // We can't know if we are 'adding' without reading current.
                // So we'll rely on the transaction read.
            }
        }

        return await runTransaction(firestore, async (transaction) => {
            // 1. ALL READS
            const soloDocRef = doc(firestore, "registrations", uid);
            const soloDoc = await transaction.get(soloDocRef);

            const currentData = soloDoc.exists() ? (soloDoc.data() as SoloRegistration) : null;
            const currentEvents = currentData?.events || [];
            const currentTeamEvents = currentData?.teamEvents || [];

            // Identify Added and Removed
            const added = newEvents.filter(e => !currentEvents.includes(e));
            const removed = currentEvents.filter(e => !newEvents.includes(e));

            // Validate Closed Events for ADDED items
            for (const eventTitle of added) {
                const status = await checkRegistrationStatus(eventTitle); // This is a non-transactional read, which is technically allowed but ideally should be passed in or read via txn if strict consistency needed. 
                // For "Configuration" data like event settings, eventual consistency is usually fine.
                if (status.isClosed) throw new Error(`Registration is closed for ${eventTitle}.`);
            }

            // ATOMIC VALIDATION: Limits
            // We use the `currentTeamEvents` read from the doc itself.
            const mockTeamRegs = currentTeamEvents.map(t => ({ eventTitle: t } as TeamRegistration));

            const validation = validateRegistrationRules(
                currentEvents, // logic replaces this, so we validate 'newEvents' instead
                mockTeamRegs,
                newEvents,
                undefined
            );

            if (!validation.valid) throw new Error(validation.message);

            if (added.length === 0 && removed.length === 0) return { success: true };

            // ... (Chest number logic same as before, simplified for brevity)
            // Read User Doc if chest number is needed
            const userDocRef = doc(firestore, "users", uid);
            const userDoc = await transaction.get(userDocRef);

            if (!userDoc.exists()) {
                throw new Error("User profile not found. Please complete your profile first.");
            }

            const userData = userDoc.data();
            if (!userData.name || !userData.department || !userData.collegeId || !userData.mobile) {
                throw new Error("Profile incomplete. Please fill all required details in Profile (including mobile number).");
            }

            let userChestNo = userData.chestNo || null;
            let globalCounterRef = doc(firestore, "counters", "user_chest_numbers");
            let globalCounterDoc = null;
            let currentGlobalCount = 0;

            if (!userChestNo && added.length > 0) {
                globalCounterDoc = await transaction.get(globalCounterRef);
                currentGlobalCount = globalCounterDoc.exists() ? (globalCounterDoc.data().count || 0) : 0;

                let isUnique = false;
                while (!isUnique) {
                    currentGlobalCount++;
                    const candidate = (100 + currentGlobalCount).toString().padStart(3, '0');

                    // Check uniqueness (Legacy)
                    const userQuery = query(collection(firestore, "users"), where("chestNo", "==", candidate));
                    const querySnap = await getDocs(userQuery);

                    // Check uniqueness (Transactional Lock)
                    const chestNoLockRef = doc(firestore, "taken_chest_numbers", candidate);
                    const chestNoLockDoc = await transaction.get(chestNoLockRef);

                    if (querySnap.empty && !chestNoLockDoc.exists()) {
                        userChestNo = candidate;
                        isUnique = true;
                    }
                }
            }

            // 3. WRITES
            if ((!userDoc.exists() || !userDoc.data().chestNo) && added.length > 0) {
                transaction.set(globalCounterRef, { count: currentGlobalCount }, { merge: true });
                transaction.set(userDocRef, { chestNo: userChestNo }, { merge: true });

                // Lock the number
                if (userChestNo) {
                    const chestNoLockRef = doc(firestore, "taken_chest_numbers", userChestNo);
                    transaction.set(chestNoLockRef, { uid, createdAt: serverTimestamp() });
                }
            }

            // Handle Removed
            for (const eventTitle of removed) {
                const regId = getRegId(eventTitle, uid);
                const regRef = doc(firestore, "event_registrations", regId);
                transaction.delete(regRef);
            }

            // Handle Added
            for (const eventTitle of added) {
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
                // teamEvents: currentTeamEvents, // preserved by merge? No, explicit set is better if we want to be sure, but we are doing merge: true below.
                // If we do merge: true, we don't need to specify teamEvents if we aren't changing them.
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
            // ==========================================
            // 1. ALL READS
            // ==========================================
            const teamDocRef = doc(firestore, "teams", teamId);
            const teamDoc = await transaction.get(teamDocRef);
            if (!teamDoc.exists()) throw new Error("Team not found");

            const teamData = teamDoc.data() as TeamRegistration;

            if (teamData.leaderId !== uid) {
                throw new Error("Only the leader can delete the team.");
            }

            // Read all member registration docs
            const memberIds = teamData.memberIds || [];
            const memberRegDocsMap: { [memberId: string]: any } = {};

            for (const memberId of memberIds) {
                const regDocRef = doc(firestore, "registrations", memberId);
                const regDoc = await transaction.get(regDocRef);
                memberRegDocsMap[memberId] = regDoc;
            }

            // ==========================================
            // 2. ALL WRITES
            // ==========================================

            // Remove this event from ALL members' registration docs
            for (const memberId of memberIds) {
                const regDocRef = doc(firestore, "registrations", memberId);
                const regDoc = memberRegDocsMap[memberId];

                if (regDoc.exists()) {
                    const data = regDoc.data() as SoloRegistration;
                    const updatedTeamEvents = (data.teamEvents || []).filter(t => t !== teamData.eventTitle);
                    if (updatedTeamEvents.length !== (data.teamEvents || []).length) {
                        transaction.set(regDocRef, { teamEvents: updatedTeamEvents }, { merge: true });
                    }
                }
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
