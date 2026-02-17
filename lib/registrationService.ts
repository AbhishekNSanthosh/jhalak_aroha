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
            // 1. Reads
            // Fetch User Regs for validation
            const soloDocRef = doc(firestore, "registrations", leaderUid);
            const soloDoc = await transaction.get(soloDocRef);
            const soloEvents = soloDoc.exists() ? (soloDoc.data() as SoloRegistration).events : [];

            const teamsRef = collection(firestore, "teams");
            // const q = query(teamsRef, where("memberIds", "array-contains", leaderUid));
            // Transaction queries are tricky/unsupported often in client SDKs for some cases, but direct get is better.
            // For validation, we'll relax the strict transactional read of *all* teams and rely on pre-fetch or optimistic.
            // However, ensuring chest number uniqueness requires the Counter read to be in transaction.

            // Re-fetch current teams for validation (outside transaction usually, but here we need safety)
            // Note: Client SDK transactions fail if you read after write. READ EVERYTHING FIRST.

            // Since we can't easily query within transaction for "all teams user is in", 
            // we will proceed with the validation based on client state passed or do a quick separate check if critical.
            // For this implementation, we will trust the client-side validation for *Limits*, 
            // but the Chest Number generation MUST be transactional.

            const eventInfo = getEventDetails(eventTitle);
            if (!eventInfo) throw new Error("Event not found");

            // Counter Ref
            const counterRef = doc(firestore, "counters", eventTitle);
            const counterDoc = await transaction.get(counterRef);
            let currentCount = 0;
            if (counterDoc.exists()) {
                currentCount = counterDoc.data().count || 0;
            }

            // 2. Logic & Validation
            if (members.length < (eventInfo.minParticipants || 1)) throw new Error("Too few members");

            // 3. Writes
            const newCount = currentCount + 1;
            const shortCode = eventInfo.shortCode || "GEN";
            const chestNo = `${shortCode}${100 + newCount}`;

            // Create Team Doc
            const newTeamRef = doc(collection(firestore, "teams"));
            const teamData = {
                id: newTeamRef.id,
                eventId: eventTitle,
                eventTitle: eventTitle,
                leaderId: leaderUid,
                members: members,
                memberIds: members.map(m => m.uid),
                status: "confirmed",
                chestNo: chestNo,
                createdAt: new Date().toISOString()
            };
            transaction.set(newTeamRef, teamData);

            // Create Admin Registration Doc (for Excel/Admin View)
            const regId = getRegId(eventTitle, newTeamRef.id); // Use Team ID for uniqueness
            const regRef = doc(firestore, "event_registrations", regId);
            transaction.set(regRef, {
                type: 'team',
                teamId: newTeamRef.id,
                chestNo: chestNo,
                eventTitle: eventTitle,
                leaderId: leaderUid,
                memberIds: members.map(m => m.uid),
                registeredAt: serverTimestamp()
            });

            // Update Counter
            transaction.set(counterRef, { count: newCount }, { merge: true });

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
            // 1. Reads
            const soloDocRef = doc(firestore, "registrations", uid);
            const soloDoc = await transaction.get(soloDocRef);
            const currentEvents = soloDoc.exists() ? ((soloDoc.data() as SoloRegistration).events || []) : [];

            // Identify Added and Removed
            const added = newEvents.filter(e => !currentEvents.includes(e));
            const removed = currentEvents.filter(e => !newEvents.includes(e));

            if (added.length === 0 && removed.length === 0) return { success: true };

            // Read counters for all ADDED events
            const chestNumbers: { [event: string]: string } = {};
            const incrementedCounts: { [event: string]: number } = {};

            for (const eventTitle of added) {
                const eventInfo = getEventDetails(eventTitle);
                if (!eventInfo) throw new Error(`Event not found: ${eventTitle}`);

                const counterRef = doc(firestore, "counters", eventTitle);
                // Note: In client SDK, we must read all documents before any writes.
                // Since 'added' is dynamic, we iterate reads.
                const counterDoc = await transaction.get(counterRef);
                const count = counterDoc.exists() ? counterDoc.data().count : 0;

                const newCount = count + 1;
                incrementedCounts[eventTitle] = newCount;
                const shortCode = eventInfo.shortCode || "GEN";
                chestNumbers[eventTitle] = `${shortCode}${100 + newCount}`;
            }

            // 2. Writes

            // Handle Removed (Undo)
            for (const eventTitle of removed) {
                const regId = getRegId(eventTitle, uid);
                const regRef = doc(firestore, "event_registrations", regId);
                transaction.delete(regRef);
            }

            // Handle Added
            for (const eventTitle of added) {
                const chestNo = chestNumbers[eventTitle];
                const newCount = incrementedCounts[eventTitle];

                // Update Counter
                const counterRef = doc(firestore, "counters", eventTitle);
                transaction.set(counterRef, { count: newCount }, { merge: true });

                // Create Admin Registration Doc
                const regId = getRegId(eventTitle, uid);
                const regRef = doc(firestore, "event_registrations", regId);
                transaction.set(regRef, {
                    type: 'individual',
                    userId: uid,
                    chestNo: chestNo,
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
