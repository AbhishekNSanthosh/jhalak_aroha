import { db } from "@/lib/firebase";
import {
    collection,
    doc,
    getDocs,
    setDoc,
    deleteDoc,
    getDoc,
    serverTimestamp,
} from "firebase/firestore";

// ─── Utility ──────────────────────────────────────────────────────────────────

/**
 * Recursively removes keys whose value is `undefined` from an object.
 * Firestore's setDoc rejects any document that contains undefined values.
 */
function stripUndefined<T extends object>(obj: T): T {
    return JSON.parse(JSON.stringify(obj, (_, v) => (v === undefined ? null : v))) as T;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EventResult {
    eventTitle: string;
    eventType: "individual" | "group"; // determines point multiplier
    first?: ResultEntry;
    second?: ResultEntry;
    third?: ResultEntry;
    updatedAt?: any;
}

export interface ResultEntry {
    chestNo: string;
    name: string;
    house: string;
    teamName?: string; // for group events
    department?: string;
    semester?: string;
}

export interface NegativeMarking {
    id?: string;
    house: string;
    offense: string;
    marks: number; // stored as negative number, e.g. -10
    eventTitle?: string;
    note?: string;
    createdAt?: any;
}

// ─── Points table ─────────────────────────────────────────────────────────────

export const POINTS = {
    individual: { first: 5, second: 3, third: 1 },
    group: { first: 10, second: 6, third: 2 },
} as const;

export const NEGATIVE_OFFENSES = [
    { label: "Abusive Themes", marks: -10 },
    { label: "Variation in Screened items", marks: -10 },
    { label: "In-Disciplinary Actions", marks: -5 },
    { label: "Not reporting for the event", marks: -3 },
    { label: "Late reporting for the event", marks: -2 },
] as const;

export const HOUSES = ["Red House", "Blue House", "Green House", "Yellow House"];

// ─── CRUD: Event Results ───────────────────────────────────────────────────────

/** Save (upsert) result for one event */
export const saveEventResult = async (
    result: EventResult
): Promise<{ success: boolean; message?: string }> => {
    if (!db) return { success: false, message: "DB not initialized" };
    try {
        const ref = doc(db, "event_results", result.eventTitle);
        // stripUndefined is essential — Firestore throws on undefined field values
        // e.g. ResultEntry.teamName is optional and may be undefined for solo events
        const payload = stripUndefined({ ...result, updatedAt: serverTimestamp() });
        await setDoc(ref, payload, { merge: true });
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
};

/** Fetch all event results, enriched with department/semester from the users collection */
export const fetchAllResults = async (): Promise<EventResult[]> => {
    if (!db) return [];
    try {
        const [resultsSnap, usersSnap] = await Promise.all([
            getDocs(collection(db, "event_results")),
            getDocs(collection(db, "users")),
        ]);

        // Build a map from chestNo -> { department, semester }
        const chestMap = new Map<string, { department?: string; semester?: string }>();
        usersSnap.docs.forEach((d) => {
            const u = d.data();
            if (u.chestNo) {
                chestMap.set(u.chestNo, {
                    department: u.department || undefined,
                    semester: u.semester || undefined,
                });
            }
        });

        const enrich = (entry: ResultEntry | undefined): ResultEntry | undefined => {
            if (!entry) return undefined;
            const extra = chestMap.get(entry.chestNo);
            return extra ? { ...entry, ...extra } : entry;
        };

        return resultsSnap.docs.map((d) => {
            const r = d.data() as EventResult;
            return {
                ...r,
                first: enrich(r.first),
                second: enrich(r.second),
                third: enrich(r.third),
            };
        });
    } catch {
        return [];
    }
};

/** Fetch single event result */
export const fetchEventResult = async (
    eventTitle: string
): Promise<EventResult | null> => {
    if (!db) return null;
    try {
        const snap = await getDoc(doc(db, "event_results", eventTitle));
        return snap.exists() ? (snap.data() as EventResult) : null;
    } catch {
        return null;
    }
};

/** Delete a result entry for an event */
export const deleteEventResult = async (
    eventTitle: string
): Promise<{ success: boolean; message?: string }> => {
    if (!db) return { success: false, message: "DB not initialized" };
    try {
        await deleteDoc(doc(db, "event_results", eventTitle));
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
};

// ─── CRUD: Negative Markings ──────────────────────────────────────────────────

/** Add a negative marking */
export const addNegativeMarking = async (
    marking: NegativeMarking
): Promise<{ success: boolean; message?: string }> => {
    if (!db) return { success: false, message: "DB not initialized" };
    try {
        const ref = doc(collection(db, "negative_markings"));
        const payload = stripUndefined({ ...marking, createdAt: serverTimestamp() });
        await setDoc(ref, payload);
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
};

/** Fetch all negative markings */
export const fetchNegativeMarkings = async (): Promise<
    (NegativeMarking & { id: string })[]
> => {
    if (!db) return [];
    try {
        const snap = await getDocs(collection(db, "negative_markings"));
        return snap.docs.map((d) => ({ id: d.id, ...(d.data() as NegativeMarking) }));
    } catch {
        return [];
    }
};

/** Delete a negative marking */
export const deleteNegativeMarking = async (
    id: string
): Promise<{ success: boolean; message?: string }> => {
    if (!db) return { success: false, message: "DB not initialized" };
    try {
        await deleteDoc(doc(db, "negative_markings", id));
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
};

// ─── Score computation ────────────────────────────────────────────────────────

export interface HouseScore {
    house: string;
    positive: number;
    negative: number;
    total: number;
    firstPlaces: number;
    secondPlaces: number;
    thirdPlaces: number;
}

export const computeHouseScores = (
    results: EventResult[],
    markings: NegativeMarking[]
): HouseScore[] => {
    const map: Record<string, HouseScore> = {};

    for (const h of HOUSES) {
        map[h] = {
            house: h,
            positive: 0,
            negative: 0,
            total: 0,
            firstPlaces: 0,
            secondPlaces: 0,
            thirdPlaces: 0,
        };
    }

    // Positive points from results
    for (const r of results) {
        const pts = POINTS[r.eventType] ?? POINTS.individual;

        const add = (entry: ResultEntry | undefined, pts: number, place: keyof Pick<HouseScore, 'firstPlaces' | 'secondPlaces' | 'thirdPlaces'>) => {
            if (!entry?.house) return;
            const h = normaliseHouse(entry.house);
            if (!map[h]) return;
            map[h].positive += pts;
            map[h][place]++;
        };

        add(r.first, pts.first, "firstPlaces");
        add(r.second, pts.second, "secondPlaces");
        add(r.third, pts.third, "thirdPlaces");
    }

    // Negative markings
    for (const m of markings) {
        const h = normaliseHouse(m.house);
        if (!map[h]) continue;
        map[h].negative += m.marks; // marks is already negative
    }

    // Compute total
    for (const h of HOUSES) {
        map[h].total = map[h].positive + map[h].negative;
    }

    return Object.values(map).sort((a, b) => b.total - a.total);
};

/** Fuzzy match a stored house string to a canonical HOUSES key */
function normaliseHouse(raw: string): string {
    const lower = (raw || "").toLowerCase();
    if (lower.includes("red")) return "Red House";
    if (lower.includes("blue")) return "Blue House";
    if (lower.includes("green")) return "Green House";
    if (lower.includes("yellow")) return "Yellow House";
    return raw; // pass through unknown
}

// ─── Individual scoreboard ────────────────────────────────────────────────────

export interface IndividualScore {
    name: string;
    chestNo: string;
    house: string;
    teamName?: string;
    department?: string;
    semester?: string;
    totalPoints: number;
    wins: { eventTitle: string; place: "first" | "second" | "third"; pts: number }[];
}

/**
 * Accumulate points per individual/team across all event results.
 * Same person appearing in multiple events gets their points summed.
 */
export const computeIndividualScores = (results: EventResult[]): IndividualScore[] => {
    // key: chestNo (unique per participant)
    const map = new Map<string, IndividualScore>();

    const upsert = (
        entry: ResultEntry | undefined,
        place: "first" | "second" | "third",
        pts: number,
        eventTitle: string
    ) => {
        if (!entry) return;
        const key = entry.chestNo || entry.name;
        if (!map.has(key)) {
            map.set(key, {
                name: entry.name,
                chestNo: entry.chestNo,
                house: normaliseHouse(entry.house || ""),
                teamName: entry.teamName,
                department: entry.department,
                semester: entry.semester,
                totalPoints: 0,
                wins: [],
            });
        }
        const rec = map.get(key)!;
        rec.totalPoints += pts;
        rec.wins.push({ eventTitle, place, pts });
    };

    for (const r of results) {
        const pts = POINTS[r.eventType] ?? POINTS.individual;
        upsert(r.first, "first", pts.first, r.eventTitle);
        upsert(r.second, "second", pts.second, r.eventTitle);
        upsert(r.third, "third", pts.third, r.eventTitle);
    }

    return Array.from(map.values()).sort((a, b) => b.totalPoints - a.totalPoints);
};

// ─── House-wise detail ────────────────────────────────────────────────────────

export interface HouseEventWin {
    eventTitle: string;
    eventType: "individual" | "group";
    place: "first" | "second" | "third";
    pts: number;
    winner: ResultEntry;
}

export interface HouseDetail {
    house: string;
    wins: HouseEventWin[];
    negativeMarkings: (NegativeMarking & { id: string })[];
    positiveTotal: number;
    negativeTotal: number;
    total: number;
}

export const computeHouseDetails = (
    results: EventResult[],
    markings: (NegativeMarking & { id: string })[]
): HouseDetail[] => {
    const map: Record<string, HouseDetail> = {};
    for (const h of HOUSES) {
        map[h] = {
            house: h,
            wins: [],
            negativeMarkings: [],
            positiveTotal: 0,
            negativeTotal: 0,
            total: 0,
        };
    }

    for (const r of results) {
        const pts = POINTS[r.eventType] ?? POINTS.individual;

        const record = (
            entry: ResultEntry | undefined,
            place: "first" | "second" | "third",
            ptsVal: number
        ) => {
            if (!entry?.house) return;
            const h = normaliseHouse(entry.house);
            if (!map[h]) return;
            map[h].wins.push({
                eventTitle: r.eventTitle,
                eventType: r.eventType,
                place,
                pts: ptsVal,
                winner: entry,
            });
            map[h].positiveTotal += ptsVal;
        };

        record(r.first, "first", pts.first);
        record(r.second, "second", pts.second);
        record(r.third, "third", pts.third);
    }

    for (const m of markings) {
        const h = normaliseHouse(m.house);
        if (!map[h]) continue;
        map[h].negativeMarkings.push(m);
        map[h].negativeTotal += m.marks;
    }

    for (const h of HOUSES) {
        map[h].total = map[h].positiveTotal + map[h].negativeTotal;
    }

    return Object.values(map).sort((a, b) => b.total - a.total);
};
