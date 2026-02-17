import { db } from "@/lib/firebase";
import { collection, getDocs, QuerySnapshot, DocumentData, doc, setDoc, query, where, writeBatch, arrayRemove } from "firebase/firestore";
import { UserProfile } from "@/data/constant";


export interface AdminUserView extends UserProfile {
    registrationCount: number;
    chestNo?: string; // User's personal chest number
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
    isRegistrationClosed: boolean;
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
                    registrations: [],
                    isRegistrationClosed: false
                });
            });
        });

        // Fetch Event Settings (Closed Status)
        const settingsRef = collection(firestore, "event_settings");
        const settingsSnap = await getDocs(settingsRef);
        settingsSnap.forEach(doc => {
            const data = doc.data();
            if (statsMap.has(doc.id)) {
                statsMap.get(doc.id)!.isRegistrationClosed = data.isClosed || false;
            }
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

export const toggleEventRegistration = async (eventTitle: string, currentStatus: boolean): Promise<{ success: boolean; message?: string }> => {
    if (!db) return { success: false, message: "Database not initialized" };
    try {
        const settingsRef = doc(db, "event_settings", eventTitle);
        await setDoc(settingsRef, { isClosed: !currentStatus }, { merge: true });
        return { success: true, message: `Registration ${!currentStatus ? "Closed" : "Opened"} for ${eventTitle}` };
    } catch (error: any) {
        console.error("Error toggling registration:", error);
        return { success: false, message: error.message || "Failed to toggle registration." };
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

// 5. Delete User Data
export const deleteUser = async (uid: string): Promise<{ success: boolean; message?: string }> => {
    if (!db) return { success: false, message: "Database not initialized" };

    try {
        const firestore = db;
        const batch = writeBatch(firestore);

        // 1. Delete User Profile
        const userRef = doc(firestore, "users", uid);
        batch.delete(userRef);

        // 2. Delete Solo Registrations Tracker
        const regTrackerRef = doc(firestore, "registrations", uid);
        batch.delete(regTrackerRef);

        // 3. Delete Individual Event Registrations
        const indRegQuery = query(collection(firestore, "event_registrations"), where("userId", "==", uid));
        const indRegSnap = await getDocs(indRegQuery);
        indRegSnap.forEach(doc => {
            batch.delete(doc.ref);
        });

        // 4. Handle Team Memberships
        // A. As Leader -> Delete Team & Team Registration
        const ledTeamQuery = query(collection(firestore, "teams"), where("leaderId", "==", uid));
        const ledTeamSnap = await getDocs(ledTeamQuery);
        ledTeamSnap.forEach(doc => {
            batch.delete(doc.ref);
        });

        const ledTeamRegQuery = query(collection(firestore, "event_registrations"), where("leaderId", "==", uid));
        const ledTeamRegSnap = await getDocs(ledTeamRegQuery);
        ledTeamRegSnap.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();

        // 5. Cleanup as Member (Separate batch due to complexity)
        const memberCleanupBatch = writeBatch(firestore);
        let hasMemberCleanup = false;

        const memTeamQuery = query(collection(firestore, "teams"), where("memberIds", "array-contains", uid));
        const memTeamSnap = await getDocs(memTeamQuery);
        memTeamSnap.forEach(doc => {
            const data = doc.data();
            if (data.leaderId !== uid) {
                memberCleanupBatch.update(doc.ref, {
                    memberIds: arrayRemove(uid),
                    members: (data.members || []).filter((m: any) => m.uid !== uid)
                });
                hasMemberCleanup = true;
            }
        });

        const memRegQuery = query(collection(firestore, "event_registrations"), where("memberIds", "array-contains", uid));
        const memRegSnap = await getDocs(memRegQuery);
        memRegSnap.forEach(doc => {
            const data = doc.data();
            if (data.leaderId !== uid) {
                memberCleanupBatch.update(doc.ref, {
                    memberIds: arrayRemove(uid)
                });
                hasMemberCleanup = true;
            }
        });

        if (hasMemberCleanup) {
            await memberCleanupBatch.commit();
        }

        return { success: true, message: "User deleted successfully." };

    } catch (error: any) {
        console.error("Error deleting user:", error);
        return { success: false, message: error.message || "Failed to delete user." };
    }
};

// 6. Bulk Delete All Users (Hazardous!)
export const deleteAllUsers = async (): Promise<{ success: boolean; message?: string }> => {
    if (!db) return { success: false, message: "Database not initialized" };
    try {
        const firestore = db;

        const deleteCollection = async (colName: string) => {
            const colRef = collection(firestore, colName);
            const snap = await getDocs(colRef);
            const batch = writeBatch(firestore);
            let count = 0;
            snap.forEach(doc => {
                batch.delete(doc.ref);
                count++;
            });
            if (count > 0) await batch.commit();
            return count;
        };

        await deleteCollection("users");
        await deleteCollection("registrations");
        await deleteCollection("event_registrations");
        await deleteCollection("teams");

        await setDoc(doc(firestore, "counters", "user_chest_numbers"), { count: 0 }, { merge: true });

        return { success: true, message: "All users and related data wiped." };

    } catch (error: any) {
        console.error("Error deleting all:", error);
        return { success: false, message: error.message || "Failed to wipe data." };
    }
};

// 7. Data Structure for Detailed Event View
export interface DetailedRegistration {
    id: string; // Document ID (registration id)
    type: 'individual' | 'team';
    chestNo: string; // The primary chest number
    teamChestNo?: string;

    // Core Participant Info (Leader for teams)
    name: string;
    email: string;
    mobile: string;
    collegeId: string;
    department: string;
    semester: string;
    house: string;
    uid: string;

    // Team Specific
    teamName?: string;
    leaderChestNo?: string;
    members?: {
        name: string;
        chestNo: string;
        uid: string;
        email: string;
        collegeId?: string;
        mobile?: string;
        department?: string;
        semester?: string;
        house?: string;
    }[];

    registeredAt: any; // Timestamp
}

// 8. Fetch Detailed Registrations for a Single Event
export const fetchDetailedEventRegistrations = async (eventTitle: string): Promise<DetailedRegistration[]> => {
    if (!db) return [];

    try {
        const firestore = db;

        // Fetch all registrations for this event
        const q = query(collection(firestore, "event_registrations"), where("eventTitle", "==", eventTitle));
        const regSnap = await getDocs(q);

        // Fetch all users to map details
        const usersRef = collection(firestore, "users");
        const usersSnap = await getDocs(usersRef);
        const userMap = new Map<string, UserProfile>();

        usersSnap.forEach(doc => {
            userMap.set(doc.id, { ...doc.data(), uid: doc.id } as UserProfile);
        });

        const results: DetailedRegistration[] = [];

        regSnap.forEach((docSnap) => {
            const data = docSnap.data();

            if (data.type === 'individual' && data.userId) {
                const user = userMap.get(data.userId);
                if (user) {
                    results.push({
                        id: docSnap.id,
                        type: 'individual',
                        chestNo: data.userChestNo || data.chestNo || "-",
                        uid: user.uid,
                        name: user.name || "Unknown",
                        email: user.email || "-",
                        mobile: user.mobile || "-",
                        collegeId: user.collegeId || "-",
                        department: user.department || "-",
                        semester: user.semester || "-",
                        house: user.house || "-",
                        registeredAt: data.registeredAt
                    });
                }
            } else if (data.type === 'team' && data.leaderId) {
                const leader = userMap.get(data.leaderId);
                const members: any[] = [];

                if (data.memberIds && Array.isArray(data.memberIds)) {
                    data.memberIds.forEach((mid: string) => {
                        if (mid === data.leaderId) return; // Skip leader
                        const mUser = userMap.get(mid);
                        if (mUser) {
                            members.push({
                                uid: mUser.uid,
                                name: mUser.name || "Unknown",
                                email: mUser.email || "-",
                                chestNo: (data.memberChestNos && data.memberChestNos[mid]) || "-",
                                collegeId: mUser.collegeId || "-",
                                mobile: mUser.mobile || "-",
                                house: mUser.house || "-",
                                department: mUser.department || "-",
                                semester: mUser.semester || "-"
                            });
                        }
                    });
                }

                if (leader) {
                    results.push({
                        id: docSnap.id,
                        type: 'team',
                        chestNo: data.teamChestNo || data.chestNo || "-", // Team Chest No
                        teamChestNo: data.teamChestNo,
                        leaderChestNo: data.leaderChestNo,
                        uid: leader.uid,
                        name: leader.name || "Unknown (Leader)",
                        teamName: data.teamName,
                        email: leader.email || "-",
                        mobile: leader.mobile || "-",
                        collegeId: leader.collegeId || "-",
                        department: leader.department || "-",
                        semester: leader.semester || "-",
                        house: leader.house || "-",
                        members: members,
                        registeredAt: data.registeredAt
                    });
                }
            }
        });

        return results;

    } catch (error) {
        console.error("Error fetching detailed registrations:", error);
        return [];
    }
};
