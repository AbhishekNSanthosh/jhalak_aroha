"use client";

import React, { useEffect, useState, useCallback } from "react";
import { categories } from "@/data/constant";
import {
  EventResult,
  NegativeMarking,
  HouseScore,
  POINTS,
  NEGATIVE_OFFENSES,
  HOUSES,
  ResultEntry,
  saveEventResult,
  fetchAllResults,
  deleteEventResult,
  addNegativeMarking,
  fetchNegativeMarkings,
  deleteNegativeMarking,
  computeHouseScores,
} from "@/lib/resultsService";
import { fetchDetailedEventRegistrations } from "@/lib/adminService";
import {
  Trophy,
  Medal,
  Plus,
  Trash2,
  ChevronDown,
  Star,
  AlertTriangle,
  BarChart3,
  Award,
  Save,
  RefreshCw,
  X,
  Search,
  Crown,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PLACE_LABELS = [
  {
    key: "first" as const,
    label: "1st Place",
    icon: Crown,
    color: "text-yellow-400",
    border: "border-yellow-500/30",
    bg: "bg-yellow-500/5",
  },
  {
    key: "second" as const,
    label: "2nd Place",
    icon: Medal,
    color: "text-gray-300",
    border: "border-gray-500/30",
    bg: "bg-gray-500/5",
  },
  {
    key: "third" as const,
    label: "3rd Place",
    icon: Award,
    color: "text-amber-700",
    border: "border-amber-700/30",
    bg: "bg-amber-700/5",
  },
];

const HOUSE_COLORS: Record<string, string> = {
  "Red House": "text-red-400 bg-red-500/10 border-red-500/20",
  "Blue House": "text-blue-400 bg-blue-500/10 border-blue-500/20",
  "Green House": "text-green-400 bg-green-500/10 border-green-500/20",
  "Yellow House": "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
};

const HOUSE_GLOW: Record<string, string> = {
  "Red House": "shadow-red-500/20",
  "Blue House": "shadow-blue-500/20",
  "Green House": "shadow-green-500/20",
  "Yellow House": "shadow-yellow-500/20",
};

const RANK_BADGE: Record<number, string> = {
  0: "bg-yellow-500 text-black",
  1: "bg-gray-400 text-black",
  2: "bg-amber-700 text-white",
};

// All events flat list from constants
const ALL_EVENTS = categories.flatMap((cat) =>
  cat.items.map((item) => ({ ...item, category: cat.title })),
);

type Tab = "results" | "negatives" | "leaderboard";

// ─── Component ───────────────────────────────────────────────────────────────

export default function ResultsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("results");

  // Results state
  const [allResults, setAllResults] = useState<EventResult[]>([]);
  const [negatives, setNegatives] = useState<
    (NegativeMarking & { id: string })[]
  >([]);
  const [houseScores, setHouseScores] = useState<HouseScore[]>([]);
  const [loading, setLoading] = useState(true);

  // Event selector
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [eventSearch, setEventSearch] = useState("");
  const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false);

  // Current editing state
  const [editResult, setEditResult] = useState<EventResult | null>(null);
  const [savingResult, setSavingResult] = useState(false);

  // Participant search for each place (single input for adding new)
  const [participantSearch, setParticipantSearch] = useState<
    Record<string, string>
  >({
    first: "",
    second: "",
    third: "",
  });
  const [participants, setParticipants] = useState<any[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  // Negative marking form
  const [negForm, setNegForm] = useState({
    house: "",
    offense: "",
    marks: -10,
    note: "",
    eventTitle: "",
  });
  const [addingNeg, setAddingNeg] = useState(false);

  // ── Load data ──────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    const [res, negs] = await Promise.all([
      fetchAllResults(),
      fetchNegativeMarkings(),
    ]);
    setAllResults(res);
    setNegatives(negs);
    setHouseScores(computeHouseScores(res, negs));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Select event to edit ───────────────────────────────────────────────────
  const handleSelectEvent = async (evTitle: string) => {
    setSelectedEvent(evTitle);
    setIsEventDropdownOpen(false);
    setEventSearch("");
    setParticipantSearch({ first: "", second: "", third: "" });

    const ev = ALL_EVENTS.find((e) => e.title === evTitle);
    const existing = allResults.find((r) => r.eventTitle === evTitle);

    if (existing) {
      setEditResult({ ...existing });
    } else {
      setEditResult({
        eventTitle: evTitle,
        eventType: ev?.eventType === "group" ? "group" : "individual",
      });
    }

    // Fetch participants for this event
    setLoadingParticipants(true);
    const data = await fetchDetailedEventRegistrations(evTitle);
    setParticipants(data);
    setLoadingParticipants(false);
  };

  // ── Add a winner to a place (supports ties) ────────────────────────────────
  const addWinner = (
    place: "first" | "second" | "third",
    entry: ResultEntry,
  ) => {
    setEditResult((prev) => {
      if (!prev) return prev;
      const current = prev[place] ?? [];
      // Avoid duplicate by chestNo
      if (current.some((e) => e.chestNo === entry.chestNo)) return prev;
      return { ...prev, [place]: [...current, entry] };
    });
  };

  // ── Remove a specific winner from a place ──────────────────────────────────
  const removeWinner = (
    place: "first" | "second" | "third",
    chestNo: string,
  ) => {
    setEditResult((prev) => {
      if (!prev) return prev;
      const updated = (prev[place] ?? []).filter((e) => e.chestNo !== chestNo);
      return { ...prev, [place]: updated.length > 0 ? updated : undefined };
    });
  };

  // ── Save result ────────────────────────────────────────────────────────────
  const handleSaveResult = async () => {
    if (!editResult) return;
    setSavingResult(true);
    const res = await saveEventResult(editResult);
    if (res.success) {
      toast.success("Result saved!");
      await loadData();
    } else {
      toast.error(res.message || "Failed to save result.");
    }
    setSavingResult(false);
  };

  // ── Delete result ──────────────────────────────────────────────────────────
  const handleDeleteResult = async (title: string) => {
    const res = await deleteEventResult(title);
    if (res.success) {
      toast.success("Result removed.");
      if (selectedEvent === title) {
        setEditResult(null);
        setSelectedEvent("");
      }
      await loadData();
    } else {
      toast.error(res.message || "Failed to delete.");
    }
  };

  // ── Add negative marking ───────────────────────────────────────────────────
  const handleAddNeg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!negForm.house || !negForm.offense) return;
    setAddingNeg(true);
    const res = await addNegativeMarking({
      house: negForm.house,
      offense: negForm.offense,
      marks: negForm.marks,
      eventTitle: negForm.eventTitle || undefined,
      note: negForm.note || undefined,
    });
    if (res.success) {
      toast.success("Negative marking added.");
      setNegForm({
        house: "",
        offense: "",
        marks: -10,
        note: "",
        eventTitle: "",
      });
      await loadData();
    } else {
      toast.error(res.message || "Failed.");
    }
    setAddingNeg(false);
  };

  // ── Delete negative marking ────────────────────────────────────────────────
  const handleDeleteNeg = async (id: string) => {
    const res = await deleteNegativeMarking(id);
    if (res.success) {
      toast.success("Deleted.");
      await loadData();
    } else {
      toast.error(res.message || "Failed.");
    }
  };

  // ── Filtered events for dropdown ───────────────────────────────────────────
  const filteredEvents = ALL_EVENTS.filter((ev) =>
    ev.title.toLowerCase().includes(eventSearch.toLowerCase()),
  );

  // ── Filtered participants for winner search ────────────────────────────────
  const getFilteredParticipants = (place: "first" | "second" | "third") => {
    const term = (participantSearch[place] || "").toLowerCase();
    if (!term) return [];
    // Already-selected chest nos for this place
    const selected = new Set((editResult?.[place] ?? []).map((e) => e.chestNo));
    return participants
      .filter(
        (p) =>
          !selected.has(p.chestNo) &&
          (p.name.toLowerCase().includes(term) ||
            p.chestNo.toLowerCase().includes(term) ||
            (p.teamName && p.teamName.toLowerCase().includes(term))),
      )
      .slice(0, 6);
  };

  // ── Current event metadata ────────────────────────────────────────────────
  const currentEventMeta = ALL_EVENTS.find((e) => e.title === selectedEvent);
  const eventPoints = editResult
    ? POINTS[editResult.eventType]
    : POINTS.individual;

  // ─── UI ────────────────────────────────────────────────────────────────────

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "results", label: "Event Results", icon: Trophy },
    { key: "negatives", label: "Negative Markings", icon: AlertTriangle },
    { key: "leaderboard", label: "Leaderboard", icon: BarChart3 },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl md:text-5xl font-black font-unbounded text-white mb-2 uppercase tracking-tighter">
          Results <span className="text-[#BA170D]">Manager</span>
        </h1>
        <p className="text-gray-400 text-sm">
          Enter event results, add negative markings, and track the house
          leaderboard. Multiple winners per place are supported for ties.
        </p>
      </div>

      {/* Points Reference */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
            <Trophy size={13} className="text-[#BA170D]" /> Points Distribution
          </h3>
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div className="text-gray-500 text-xs uppercase tracking-wider">
              Place
            </div>
            <div className="text-gray-500 text-xs uppercase tracking-wider">
              Solo Event
            </div>
            <div className="text-gray-500 text-xs uppercase tracking-wider">
              Group Event
            </div>
            {[
              { place: "1st", individual: 5, group: 10 },
              { place: "2nd", individual: 3, group: 6 },
              { place: "3rd", individual: 1, group: 2 },
            ].map((row) => (
              <React.Fragment key={row.place}>
                <div className="font-bold text-white">{row.place}</div>
                <div className="text-yellow-400 font-black">
                  {row.individual}
                </div>
                <div className="text-blue-400 font-black">{row.group}</div>
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
            <AlertTriangle size={13} className="text-red-400" /> Negative
            Markings
          </h3>
          <div className="space-y-1.5">
            {NEGATIVE_OFFENSES.map((o) => (
              <div
                key={o.label}
                className="flex justify-between items-center text-sm"
              >
                <span className="text-gray-300">{o.label}</span>
                <span className="text-red-400 font-bold font-mono">
                  {o.marks}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 border border-white/10 p-1 rounded-xl w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === key
                ? "bg-[#BA170D] text-white shadow-lg shadow-red-900/30"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB: Results ── */}
      {activeTab === "results" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Event Selector + Entry Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Dropdown */}
            <div className="relative">
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                Select Event
              </label>
              <button
                onClick={() => setIsEventDropdownOpen((p) => !p)}
                className="w-full flex items-center justify-between gap-3 bg-white/5 border border-white/10 hover:border-white/20 rounded-xl px-4 py-3 text-left transition-colors"
              >
                <span
                  className={
                    selectedEvent ? "text-white font-bold" : "text-gray-500"
                  }
                >
                  {selectedEvent || "Choose an event to enter results…"}
                </span>
                <ChevronDown
                  size={16}
                  className={`text-gray-400 transition-transform ${isEventDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isEventDropdownOpen && (
                <div className="absolute top-full mt-2 left-0 right-0 z-20 bg-neutral-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                  <div className="p-2 border-b border-white/10">
                    <div className="relative">
                      <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                      />
                      <input
                        autoFocus
                        type="text"
                        placeholder="Search events…"
                        value={eventSearch}
                        onChange={(e) => setEventSearch(e.target.value)}
                        className="w-full bg-white/5 rounded-lg pl-8 pr-3 py-2 text-sm text-white outline-none placeholder:text-gray-600"
                      />
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {filteredEvents.length === 0 ? (
                      <p className="p-4 text-sm text-gray-500 text-center">
                        No events found.
                      </p>
                    ) : (
                      filteredEvents.map((ev) => (
                        <button
                          key={ev.title}
                          onClick={() => handleSelectEvent(ev.title)}
                          className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-white/5 ${
                            selectedEvent === ev.title
                              ? "text-[#BA170D] font-bold"
                              : "text-gray-300"
                          }`}
                        >
                          <span className="font-bold">{ev.title}</span>
                          <span className="ml-2 text-xs text-gray-500">
                            {ev.eventType === "group" ? "Group" : "Individual"}{" "}
                            · {ev.category}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Result Entry Form */}
            {editResult && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-black font-unbounded text-white uppercase">
                      {editResult.eventTitle}
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {editResult.eventType === "group"
                        ? "Group Event"
                        : "Individual Event"}{" "}
                      · Points:{" "}
                      <span className="text-yellow-400 font-bold">
                        {eventPoints.first}
                      </span>{" "}
                      /{" "}
                      <span className="text-gray-300 font-bold">
                        {eventPoints.second}
                      </span>{" "}
                      /{" "}
                      <span className="text-amber-700 font-bold">
                        {eventPoints.third}
                      </span>
                      <span className="ml-3 text-gray-600">
                        · Each tied winner receives full points
                      </span>
                    </p>
                  </div>
                  {loadingParticipants && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <RefreshCw size={12} className="animate-spin" /> Loading
                      participants…
                    </span>
                  )}
                </div>

                {PLACE_LABELS.map(
                  ({ key, label, icon: Icon, color, border, bg }) => {
                    const currentWinners = editResult[key] ?? [];
                    const filtered = getFilteredParticipants(key);

                    return (
                      <div
                        key={key}
                        className={`rounded-xl border p-4 space-y-3 overflow-visible ${border} ${bg}`}
                      >
                        {/* Place header */}
                        <div className="flex items-center gap-2">
                          <Icon size={16} className={color} />
                          <span className={`text-sm font-bold ${color}`}>
                            {label}
                          </span>
                          {currentWinners.length > 1 && (
                            <span className="ml-1 inline-flex items-center gap-1 text-[10px] bg-white/10 border border-white/10 rounded-full px-2 py-0.5 text-gray-400">
                              <Users size={9} />
                              Tied ({currentWinners.length})
                            </span>
                          )}
                          <span
                            className={`ml-auto text-xs font-bold font-mono ${color}`}
                          >
                            +{eventPoints[key]}pts each
                          </span>
                        </div>

                        {/* Current winners list */}
                        {currentWinners.length > 0 && (
                          <div className="space-y-1.5">
                            {currentWinners.map((winner, wi) => (
                              <div
                                key={`${winner.chestNo}-${wi}`}
                                className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2"
                              >
                                <div>
                                  <p className="text-sm font-bold text-white">
                                    {winner.name}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    Chest: {winner.chestNo}
                                    {winner.teamName &&
                                      ` · Team: ${winner.teamName}`}
                                    {winner.house && (
                                      <span className="ml-2 text-gray-300">
                                        · {winner.house}
                                      </span>
                                    )}
                                  </p>
                                </div>
                                <button
                                  onClick={() =>
                                    removeWinner(key, winner.chestNo)
                                  }
                                  className="text-gray-500 hover:text-red-400 transition-colors p-1"
                                  title="Remove this winner"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add another winner search */}
                        <div className="relative">
                          <Search
                            size={13}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 z-10"
                          />
                          <input
                            type="text"
                            placeholder={
                              currentWinners.length === 0
                                ? "Search by name or chest no…"
                                : "Add another winner (shared place)…"
                            }
                            value={participantSearch[key]}
                            onChange={(e) =>
                              setParticipantSearch((p) => ({
                                ...p,
                                [key]: e.target.value,
                              }))
                            }
                            className="w-full bg-black/40 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm text-white outline-none placeholder:text-gray-600 focus:border-white/30 transition-colors"
                          />
                          {/* z-[200] guarantees the dropdown is always on top of all sibling cards */}
                          {filtered.length > 0 && (
                            <div className="absolute top-full mt-1 left-0 right-0 z-[200] bg-neutral-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                              {filtered.map((p) => (
                                <button
                                  key={p.id}
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => {
                                    addWinner(key, {
                                      chestNo: p.chestNo,
                                      name: p.name,
                                      house: p.house || "",
                                      teamName: p.teamName,
                                    });
                                    setParticipantSearch((prev) => ({
                                      ...prev,
                                      [key]: "",
                                    }));
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors border-b border-white/5 last:border-none"
                                >
                                  <span className="text-white font-bold">
                                    {p.name}
                                  </span>
                                  <span className="text-xs text-gray-500 ml-2">
                                    #{p.chestNo}
                                    {p.teamName && ` · ${p.teamName}`}
                                    {p.house && ` · ${p.house}`}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                          {/* Manual entry fallback when no participants match */}
                          {participantSearch[key].trim() &&
                            filtered.length === 0 &&
                            !loadingParticipants && (
                              <div className="absolute top-full mt-1 left-0 right-0 z-[200] bg-neutral-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                                <div className="px-4 py-2 text-xs text-gray-500 border-b border-white/5">
                                  No registered participant found. Enter
                                  manually:
                                </div>
                                <button
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => {
                                    const val = participantSearch[key].trim();
                                    addWinner(key, {
                                      chestNo: val,
                                      name: val,
                                      house: "",
                                    });
                                    setParticipantSearch((prev) => ({
                                      ...prev,
                                      [key]: "",
                                    }));
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors text-gray-300"
                                >
                                  Use &ldquo;{participantSearch[key].trim()}
                                  &rdquo; as name/chest no
                                </button>
                              </div>
                            )}
                        </div>
                      </div>
                    );
                  },
                )}

                <button
                  onClick={handleSaveResult}
                  disabled={savingResult}
                  className="w-full flex items-center justify-center gap-2 bg-[#BA170D] hover:bg-[#a0140b] text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-red-900/20"
                >
                  {savingResult ? (
                    <RefreshCw size={15} className="animate-spin" />
                  ) : (
                    <Save size={15} />
                  )}
                  {savingResult ? "Saving…" : "Save Result"}
                </button>
              </div>
            )}
          </div>

          {/* Right: Saved Results List */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Saved Results ({allResults.length})
            </h3>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-20 bg-white/5 border border-white/5 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : allResults.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center text-gray-500 text-sm">
                No results entered yet.
              </div>
            ) : (
              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                {allResults.map((r) => (
                  <div
                    key={r.eventTitle}
                    className={`bg-white/5 border rounded-xl p-4 cursor-pointer transition-all hover:border-white/20 ${
                      selectedEvent === r.eventTitle
                        ? "border-[#BA170D]/50 bg-[#BA170D]/5"
                        : "border-white/10"
                    }`}
                    onClick={() => handleSelectEvent(r.eventTitle)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">
                          {r.eventTitle}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {r.eventType}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteResult(r.eventTitle);
                        }}
                        className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0 p-1"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="mt-2 space-y-0.5">
                      {(r.first ?? [])
                        .map((w, i) => (
                          <p key={i} className="text-xs text-yellow-400">
                            🥇 {w.name}{" "}
                            <span className="text-gray-500">({w.house})</span>
                            {(r.first?.length ?? 0) > 1 && i === 0 && (
                              <span className="ml-1 text-gray-600 text-[10px]">
                                +{(r.first?.length ?? 1) - 1} more
                              </span>
                            )}
                          </p>
                        ))
                        .slice(0, 1)}
                      {(r.second ?? [])
                        .map((w, i) => (
                          <p key={i} className="text-xs text-gray-300">
                            🥈 {w.name}{" "}
                            <span className="text-gray-500">({w.house})</span>
                            {(r.second?.length ?? 0) > 1 && i === 0 && (
                              <span className="ml-1 text-gray-600 text-[10px]">
                                +{(r.second?.length ?? 1) - 1} more
                              </span>
                            )}
                          </p>
                        ))
                        .slice(0, 1)}
                      {(r.third ?? [])
                        .map((w, i) => (
                          <p key={i} className="text-xs text-amber-700">
                            🥉 {w.name}{" "}
                            <span className="text-gray-500">({w.house})</span>
                            {(r.third?.length ?? 0) > 1 && i === 0 && (
                              <span className="ml-1 text-gray-600 text-[10px]">
                                +{(r.third?.length ?? 1) - 1} more
                              </span>
                            )}
                          </p>
                        ))
                        .slice(0, 1)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: Negative Markings ── */}
      {activeTab === "negatives" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Add Form */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-300 mb-5 flex items-center gap-2">
              <AlertTriangle size={14} className="text-red-400" /> Add Negative
              Marking
            </h2>
            <form onSubmit={handleAddNeg} className="space-y-4">
              {/* House */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-bold uppercase tracking-wider">
                  House *
                </label>
                <select
                  required
                  value={negForm.house}
                  onChange={(e) =>
                    setNegForm((p) => ({ ...p, house: e.target.value }))
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-white/30 transition-colors"
                >
                  <option value="" className="bg-black">
                    Select house…
                  </option>
                  {HOUSES.map((h) => (
                    <option key={h} value={h} className="bg-black">
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Offense */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-bold uppercase tracking-wider">
                  Offense *
                </label>
                <select
                  required
                  value={negForm.offense}
                  onChange={(e) => {
                    const off = NEGATIVE_OFFENSES.find(
                      (o) => o.label === e.target.value,
                    );
                    setNegForm((p) => ({
                      ...p,
                      offense: e.target.value,
                      marks: off ? off.marks : p.marks,
                    }));
                  }}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-white/30 transition-colors"
                >
                  <option value="" className="bg-black">
                    Select offense…
                  </option>
                  {NEGATIVE_OFFENSES.map((o) => (
                    <option key={o.label} value={o.label} className="bg-black">
                      {o.label} ({o.marks})
                    </option>
                  ))}
                </select>
              </div>

              {/* Marks (editable for custom) */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-bold uppercase tracking-wider">
                  Marks (negative number)
                </label>
                <input
                  type="number"
                  max={0}
                  value={negForm.marks}
                  onChange={(e) =>
                    setNegForm((p) => ({
                      ...p,
                      marks: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-red-400 font-bold text-sm outline-none focus:border-white/30 transition-colors"
                />
              </div>

              {/* Event (optional) */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-bold uppercase tracking-wider">
                  Related Event (optional)
                </label>
                <select
                  value={negForm.eventTitle}
                  onChange={(e) =>
                    setNegForm((p) => ({ ...p, eventTitle: e.target.value }))
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-white/30 transition-colors"
                >
                  <option value="" className="bg-black">
                    None
                  </option>
                  {ALL_EVENTS.map((ev) => (
                    <option
                      key={ev.title}
                      value={ev.title}
                      className="bg-black"
                    >
                      {ev.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-bold uppercase tracking-wider">
                  Note (optional)
                </label>
                <input
                  type="text"
                  placeholder="Additional context…"
                  value={negForm.note}
                  onChange={(e) =>
                    setNegForm((p) => ({ ...p, note: e.target.value }))
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-white/30 transition-colors placeholder:text-gray-600"
                />
              </div>

              <button
                type="submit"
                disabled={addingNeg}
                className="w-full flex items-center justify-center gap-2 bg-red-600/80 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
              >
                {addingNeg ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Plus size={14} />
                )}
                {addingNeg ? "Adding…" : "Add Negative Marking"}
              </button>
            </form>
          </div>

          {/* Existing negative markings */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
              Recorded Markings ({negatives.length})
            </h3>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-16 bg-white/5 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : negatives.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center text-gray-500 text-sm">
                No negative markings recorded.
              </div>
            ) : (
              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                {negatives.map((n) => (
                  <div
                    key={n.id}
                    className="bg-white/5 border border-red-500/10 rounded-xl p-4 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full border ${HOUSE_COLORS[n.house] || "text-gray-400 border-gray-500/20 bg-gray-500/10"}`}
                        >
                          {n.house}
                        </span>
                        <span className="text-red-400 font-black font-mono">
                          {n.marks}
                        </span>
                      </div>
                      <p className="text-sm text-white mt-1">{n.offense}</p>
                      {n.eventTitle && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          Event: {n.eventTitle}
                        </p>
                      )}
                      {n.note && (
                        <p className="text-xs text-gray-500 mt-0.5 italic">
                          {n.note}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteNeg(n.id)}
                      className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0 p-1"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: Leaderboard ── */}
      {activeTab === "leaderboard" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <BarChart3 size={13} className="text-[#BA170D]" /> House Standings
            </h2>
            <button
              onClick={loadData}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors"
            >
              <RefreshCw size={12} /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-28 bg-white/5 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : (
            <>
              {/* Top 3 podium */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {houseScores.slice(0, 3).map((hs, idx) => (
                  <div
                    key={hs.house}
                    className={`relative rounded-2xl border p-6 shadow-xl text-center overflow-hidden ${
                      HOUSE_GLOW[hs.house] || ""
                    } ${HOUSE_COLORS[hs.house]?.replace("text-", "border-").replace("/10", "/30") || "border-white/10"} bg-white/5`}
                  >
                    <div
                      className={`absolute inset-0 opacity-5 ${
                        hs.house.includes("Red")
                          ? "bg-red-500"
                          : hs.house.includes("Blue")
                            ? "bg-blue-500"
                            : hs.house.includes("Green")
                              ? "bg-green-500"
                              : "bg-yellow-500"
                      }`}
                    />
                    <div className={`relative z-10`}>
                      <div
                        className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-black text-lg mb-3 ${RANK_BADGE[idx] || "bg-white/10 text-white"}`}
                      >
                        {idx + 1}
                      </div>
                      <h3
                        className={`font-black font-unbounded text-sm uppercase tracking-wider mb-1 ${HOUSE_COLORS[hs.house]?.split(" ")[0] || "text-white"}`}
                      >
                        {hs.house}
                      </h3>
                      <div className="text-4xl font-black text-white font-unbounded my-2">
                        {hs.total}
                      </div>
                      <p className="text-xs text-gray-400 font-mono">pts</p>
                      <div className="mt-3 flex justify-center gap-4 text-xs text-gray-500">
                        <span>+{hs.positive} pts</span>
                        <span className="text-red-400">{hs.negative} pts</span>
                      </div>
                      <div className="mt-3 flex justify-center gap-3 text-xs">
                        {hs.firstPlaces > 0 && (
                          <span className="text-yellow-400">
                            🥇 {hs.firstPlaces}
                          </span>
                        )}
                        {hs.secondPlaces > 0 && (
                          <span className="text-gray-300">
                            🥈 {hs.secondPlaces}
                          </span>
                        )}
                        {hs.thirdPlaces > 0 && (
                          <span className="text-amber-700">
                            🥉 {hs.thirdPlaces}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Full table */}
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-xs uppercase tracking-widest text-gray-500">
                      <th className="text-left px-6 py-4">Rank</th>
                      <th className="text-left px-4 py-4">House</th>
                      <th className="text-right px-4 py-4">+Points</th>
                      <th className="text-right px-4 py-4">−Marks</th>
                      <th className="text-right px-4 py-4 font-black">Total</th>
                      <th className="text-right px-6 py-4">Places</th>
                    </tr>
                  </thead>
                  <tbody>
                    {houseScores.map((hs, idx) => (
                      <tr
                        key={hs.house}
                        className="border-b border-white/5 last:border-none hover:bg-white/3 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black ${RANK_BADGE[idx] || "bg-white/10 text-white"}`}
                          >
                            {idx + 1}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`font-bold ${HOUSE_COLORS[hs.house]?.split(" ")[0] || "text-white"}`}
                          >
                            {hs.house}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right text-green-400 font-mono font-bold">
                          +{hs.positive}
                        </td>
                        <td className="px-4 py-4 text-right text-red-400 font-mono font-bold">
                          {hs.negative === 0 ? "—" : hs.negative}
                        </td>
                        <td className="px-4 py-4 text-right font-black text-white text-base">
                          {hs.total}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2 text-xs">
                          {hs.firstPlaces > 0 && (
                            <span className="text-yellow-400">
                              🥇×{hs.firstPlaces}
                            </span>
                          )}
                          {hs.secondPlaces > 0 && (
                            <span className="text-gray-300">
                              🥈×{hs.secondPlaces}
                            </span>
                          )}
                          {hs.thirdPlaces > 0 && (
                            <span className="text-amber-700">
                              🥉×{hs.thirdPlaces}
                            </span>
                          )}
                          {hs.firstPlaces === 0 &&
                            hs.secondPlaces === 0 &&
                            hs.thirdPlaces === 0 && (
                              <span className="text-gray-600">—</span>
                            )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary footer */}
              <p className="text-xs text-gray-600 text-center">
                Based on {allResults.length} event result
                {allResults.length !== 1 ? "s" : ""} and {negatives.length}{" "}
                negative marking{negatives.length !== 1 ? "s" : ""}.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
