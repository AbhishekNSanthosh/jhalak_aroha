import { db } from "@/lib/firebase";
import { collection, getDocs, QuerySnapshot, DocumentData, doc, setDoc, query, where, writeBatch, arrayRemove } from "firebase/firestore";
import { UserProfile } from "@/data/constant";


export interface AdminUserView extends UserProfile {
    registrationCount: number;
    chestNumbers: string[]; // List of chest numbers (if any)
    events: string[]; // List of registered event titles
}

export const fetchAllUsersWithData = async (): Promise<AdminUserView[]> => {
    if (!db) return [];

    try {
        const firestore = db; // Capture for closure safety if needed, though db is external

        // 1. Fetch All Users
        const usersRef = collection(firestore, "users");
        const usersSnap = await getDocs(usersRef);
        const users: UserProfile[] = [];
        usersSnap.forEach(doc => {
            const userData = doc.data() as UserProfile;
            // Ensure uid is set from doc.id if missing in data
            users.push({ ...userData, uid: doc.id });
        });


        // 2. Fetch All Event Registrations
        const regsRef = collection(firestore, "event_registrations");
        const regsSnap = await getDocs(regsRef);

        // Map: UserId -> { count, chestNos, eventTitles }
        const regMap = new Map<string, { count: number, chests: Set<string>, events: Set<string> }>();

        regsSnap.forEach(doc => {
            const data = doc.data();
            // Handle Individual and Team
            if (data.type === 'individual' && data.userId) {
                if (!regMap.has(data.userId)) regMap.set(data.userId, { count: 0, chests: new Set(), events: new Set() });
                const entry = regMap.get(data.userId)!;
                entry.count++;
                if (data.chestNo) entry.chests.add(data.chestNo);
                if (data.eventTitle) entry.events.add(data.eventTitle);

            } else if (data.type === 'team' && data.memberIds && Array.isArray(data.memberIds)) {
                // Determine if we count this for every member or just the team?
                // Usually for "User Management", we want to see what they are participating in.
                data.memberIds.forEach((uid: string) => {
                    if (!regMap.has(uid)) regMap.set(uid, { count: 0, chests: new Set(), events: new Set() });
                    const entry = regMap.get(uid)!;
                    entry.count++;
                    if (data.chestNo) entry.chests.add(data.chestNo);
                    if (data.eventTitle) entry.events.add(data.eventTitle);
                });
            }
        });

        // 3. Merge
        const result: AdminUserView[] = users.map(user => {
            const regData = regMap.get(user.uid) || { count: 0, chests: new Set<string>(), events: new Set<string>() };
            return {
                ...user,
                registrationCount: regData.count,
                chestNumbers: Array.from(regData.chests),
                events: Array.from(regData.events)
            };
        });

        return result;

    } catch (error) {
        console.error("Error fetching admin data:", error);
        return [];
    }
};

export interface EventStat {
    title: string;
    shortCode: string;
    type: 'individual' | 'group';
    category: string;
    totalRegistrations: number; // Count of registration docs (Teams count as 1 here usually, or should we count teams?)
    // Let's count "Entries" (Teams or Individuals) and "Participants" (People)
    entryCount: number;
    participantCount: number;
    registrations: any[]; // Full data for export
}

import { categories } from "@/data/constant";

export const fetchEventStats = async (): Promise<EventStat[]> => {
    if (!db) return [];

    try {
        const firestore = db;
        const regsRef = collection(firestore, "event_registrations");
        const regsSnap = await getDocs(regsRef);

        // Initialize Map with all available events from constants
        const statsMap = new Map<string, EventStat>();

        categories.forEach(cat => {
            cat.items.forEach(item => {
                statsMap.set(item.title, {
                    title: item.title,
                    shortCode: item.shortCode || "N/A",
                    type: item.eventType,
                    category: cat.title,
                    totalRegistrations: 0,
                    entryCount: 0,
                    participantCount: 0,
                    registrations: []
                });
            });
        });

        regsSnap.forEach(doc => {
            const data = doc.data();
            const eventTitle = data.eventTitle;

            if (statsMap.has(eventTitle)) {
                const stat = statsMap.get(eventTitle)!;
                stat.registrations.push(data);
                stat.entryCount++;

                if (data.type === 'individual') {
                    stat.participantCount++;
                } else if (data.type === 'team' && Array.isArray(data.memberIds)) {
                    stat.participantCount += data.memberIds.length;
                }
            }
        });

        return Array.from(statsMap.values());

    } catch (error) {
        console.error("Error fetching event stats:", error);
        return [];
    }
};



export const resetEventCounter = async (eventTitle: string): Promise<{ success: boolean; message?: string }> => {
    if (!db) return { success: false, message: "Database not initialized" };

    try {
        const firestore = db;

        // 1. Fetch all registrations for this event
        const regQuery = query(collection(firestore, "event_registrations"), where("eventTitle", "==", eventTitle));
        const regDocs = await getDocs(regQuery);

        if (regDocs.empty) {
            // Just reset counter if no registrations
            const counterRef = doc(firestore, "counters", eventTitle);
            await setDoc(counterRef, { count: 0 }, { merge: true });
            return { success: true, message: "Counter reset (No registrations found)." };
        }

        // 2. Perform Batch Deletion (Batches of 500)
        // Since we might have > 500 ops, we'll process in chunks or just one big batch if small.
        // For simplicity in this context, assuming < 500 participants per event to delete at once or we loop.

        const batch = writeBatch(firestore);
        let opCount = 0;

        for (const regDoc of regDocs.docs) {
            const data = regDoc.data();

            // Delete Event Registration Doc
            batch.delete(regDoc.ref);
            opCount++;

            // Handle Individual: Remove from User Profile
            if (data.type === 'individual' && data.userId) {
                const userRef = doc(firestore, "registrations", data.userId);
                // We use arrayRemove to take this event out of their list
                batch.update(userRef, {
                    events: arrayRemove(eventTitle)
                });
                opCount++;
            }
            // Handle Team: Delete Team Doc
            else if (data.type === 'team' && data.teamId) {
                const teamRef = doc(firestore, "teams", data.teamId);
                batch.delete(teamRef);
                opCount++;
            }
        }

        // 3. Reset Counter
        const counterRef = doc(firestore, "counters", eventTitle);
        batch.set(counterRef, { count: 0 }, { merge: true });
        opCount++;

        await batch.commit();

        return { success: true, message: `Reset complete. Deleted ${regDocs.size} registrations and reset counter.` };

    } catch (error: any) {
        console.error("Error resetting counter and data:", error);
        return { success: false, message: error.message || "Failed to reset." };
    }
};



// 4. Update User Role
export const updateUserRole = async (uid: string, newRole: string): Promise<{ success: boolean; message?: string }> => {
    if (!db) return { success: false, message: "Database not initialized" };
    try {
        const userRef = doc(db, "users", uid);
        await setDoc(userRef, { role: newRole }, { merge: true });
        return { success: true, message: "User role updated successfully." };
    } catch (error: any) {
        console.error("Error updating user role:", error);
        return { success: false, message: error.message || "Failed to update role." };
    }
};
