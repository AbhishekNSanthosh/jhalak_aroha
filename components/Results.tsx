"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Crown,
  Medal,
  Award,
  User,
  BarChart2,
  Trophy,
  MinusCircle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  EventResult,
  HouseScore,
  IndividualScore,
  HouseDetail,
  NegativeMarking,
  fetchAllResults,
  fetchNegativeMarkings,
  computeHouseScores,
  computeIndividualScores,
  computeHouseDetails,
} from "@/lib/resultsService";

gsap.registerPlugin(ScrollTrigger);

// ─── Design tokens ────────────────────────────────────────────────────────────

const HOUSE_META: Record<
  string,
  {
    accent: string;
    glow: string;
    bar: string;
    badge: string;
    ring: string;
    bg: string;
  }
> = {
  "Red House": {
    accent: "text-red-400",
    glow: "bg-red-500/10",
    bar: "bg-gradient-to-r from-red-700 to-red-400",
    badge: "border-red-500/30 bg-red-500/10 text-red-400",
    ring: "ring-red-500/30",
    bg: "bg-red-500/5",
  },
  "Blue House": {
    accent: "text-blue-400",
    glow: "bg-blue-500/10",
    bar: "bg-gradient-to-r from-blue-700 to-blue-400",
    badge: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    ring: "ring-blue-500/30",
    bg: "bg-blue-500/5",
  },
  "Green House": {
    accent: "text-green-400",
    glow: "bg-green-500/10",
    bar: "bg-gradient-to-r from-green-700 to-green-400",
    badge: "border-green-500/30 bg-green-500/10 text-green-400",
    ring: "ring-green-500/30",
    bg: "bg-green-500/5",
  },
  "Yellow House": {
    accent: "text-yellow-400",
    glow: "bg-yellow-500/10",
    bar: "bg-gradient-to-r from-yellow-600 to-yellow-400",
    badge: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
    ring: "ring-yellow-500/30",
    bg: "bg-yellow-500/5",
  },
};

const RANK_NUM_BG = [
  "bg-yellow-500 text-black",
  "bg-gray-400 text-black",
  "bg-amber-700 text-white",
  "bg-white/10 text-white",
];

const PLACE_ICONS = [
  { Icon: Crown, color: "text-yellow-400", size: 13 },
  { Icon: Medal, color: "text-gray-300", size: 13 },
  { Icon: Award, color: "text-amber-700", size: 13 },
];

const PLACE_KEYS = ["first", "second", "third"] as const;

type Tab = "house" | "individual" | "housewise";

// ─── Helper ────────────────────────────────────────────────────────────────────

function PlaceIcon({
  place,
  size = 13,
}: {
  place: "first" | "second" | "third";
  size?: number;
}) {
  const idx = PLACE_KEYS.indexOf(place);
  const { Icon, color } = PLACE_ICONS[idx] ?? PLACE_ICONS[2];
  return <Icon size={size} className={color} />;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Results({
  standalone = false,
}: {
  standalone?: boolean;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const tabContentRef = useRef<HTMLDivElement>(null);
  const tabBarRef = useRef<HTMLDivElement>(null);
  const orb1Ref = useRef<HTMLDivElement>(null);
  const orb2Ref = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  const [results, setResults] = useState<EventResult[]>([]);
  const [scores, setScores] = useState<HouseScore[]>([]);
  const [individuals, setIndividuals] = useState<IndividualScore[]>([]);
  const [houseDetails, setHouseDetails] = useState<HouseDetail[]>([]);
  const [negatives, setNegatives] = useState<
    (NegativeMarking & { id: string })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("house");

  // ── Data fetch ────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const [res, negs] = await Promise.all([
        fetchAllResults(),
        fetchNegativeMarkings(),
      ]);
      setResults(res);
      setNegatives(negs);
      setScores(computeHouseScores(res, negs));
      setIndividuals(computeIndividualScores(res));
      setHouseDetails(computeHouseDetails(res, negs));
      setLoading(false);
    })();
  }, []);

  // ── Initial load animation ────────────────────────────────────────────────
  useEffect(() => {
    if (loading) return;

    const ctx = gsap.context(() => {
      // Header scroll-reveal
      gsap.from(".results-header", {
        scrollTrigger: { trigger: sectionRef.current, start: "top 80%" },
        y: 50,
        opacity: 0,
        duration: 1.1,
        ease: "power3.out",
      });

      // Tab bar drops in from above
      gsap.from(tabBarRef.current, {
        y: -24,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        delay: 0.3,
      });

      // Floating ambient orbs
      gsap.to(orb1Ref.current, {
        y: -40,
        x: 20,
        duration: 8,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });
      gsap.to(orb2Ref.current, {
        y: 30,
        x: -15,
        duration: 10,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
        delay: 2,
      });

      // Score count-up (house leaderboard numbers)
      document.querySelectorAll<HTMLElement>(".score-count").forEach((el) => {
        const target = parseInt(el.dataset.target ?? "0", 10);
        gsap.fromTo(
          el,
          { innerText: 0 },
          {
            innerText: target,
            duration: 1.6,
            ease: "power2.out",
            delay: 0.5,
            snap: { innerText: 1 },
            scrollTrigger: { trigger: el, start: "top 90%" },
          },
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [loading]);

  // ── Tab-switch animation (skip the very first render, handled by load effect) ──
  useEffect(() => {
    if (loading || !tabContentRef.current) return;
    if (isFirstRender.current) {
      isFirstRender.current = false;
      // Still animate cards for the initial tab
    }

    const ctx = gsap.context(() => {
      // Cards stagger up
      gsap.fromTo(
        ".anim-card",
        { y: 36, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.55,
          stagger: 0.06,
          ease: "power3.out",
          clearProps: "transform,opacity",
        },
      );

      // Progress bars sweep in
      gsap.set(".anim-bar", { scaleX: 0, transformOrigin: "left" });
      gsap.to(".anim-bar", {
        scaleX: 1,
        duration: 0.9,
        stagger: 0.05,
        ease: "power2.out",
        delay: 0.15,
        clearProps: "transform",
      });
    }, tabContentRef);

    return () => ctx.revert();
  }, [activeTab, loading]);

  // ─────────────────────────────────────────────────────────────────────────

  const hasData = results.length > 0 || scores.some((s) => s.total !== 0);

  if (!loading && !hasData) {
    if (!standalone) return null;
    return (
      <section
        ref={sectionRef}
        id="results"
        className="relative bg-[#0A0A0A] text-white py-20 px-4 sm:px-8 md:px-16 lg:px-24"
      >
        <div className="container mx-auto max-w-6xl text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="w-8 h-px bg-[#BA170D]" />
            <span className="text-[#BA170D] font-cinzel font-bold text-sm uppercase tracking-[0.3em]">
              Scoreboard
            </span>
            <span className="w-8 h-px bg-[#BA170D]" />
          </div>
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-light tracking-tighter mb-10">
            Event{" "}
            <span className="font-serif italic text-white/50">Results</span>
          </h2>
          <p className="text-gray-500 text-sm">
            Results will be published here as events conclude. Check back soon!
          </p>
        </div>
      </section>
    );
  }

  const maxScore = Math.max(...scores.map((s) => s.total), 1);
  const maxIndividual = Math.max(...individuals.map((i) => i.totalPoints), 1);

  return (
    <section
      ref={sectionRef}
      id="results"
      className={`relative bg-[#0A0A0A] text-white py-20 px-4 sm:px-8 md:px-16 lg:px-24 overflow-hidden ${
        standalone ? "" : "border-t border-white/5"
      }`}
      style={{ fontFamily: "var(--font-poppins), sans-serif" }}
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[50vw] bg-[#BA170D]/4 rounded-full blur-[130px] mix-blend-screen" />
        {/* Floating ambient orbs */}
        <div
          ref={orb1Ref}
          className="absolute top-1/4 left-[10%] w-64 h-64 rounded-full bg-[#BA170D]/5 blur-[100px] pointer-events-none"
        />
        <div
          ref={orb2Ref}
          className="absolute bottom-1/4 right-[8%] w-48 h-48 rounded-full bg-blue-500/5 blur-[80px] pointer-events-none"
        />
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.03]" />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_80%)] pointer-events-none opacity-50" />

      <div className="container mx-auto relative z-10 max-w-6xl">
        {/* ── Header ── */}
        <div className="text-center mb-10 sm:mb-14 results-header">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="w-8 h-px bg-[#BA170D]" />
            <span className="text-[#BA170D] font-cinzel font-bold text-sm uppercase tracking-[0.3em]">
              Scoreboard
            </span>
            <span className="w-8 h-px bg-[#BA170D]" />
          </div>
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-light tracking-tighter">
            Event{" "}
            <span className="font-serif italic text-white/50">Results</span>
          </h2>
        </div>

        {/* ── Tabs ── */}
        <div className="mb-8 sm:mb-10" ref={tabBarRef}>
          <div className="flex sm:justify-center">
            <div className="w-full sm:w-auto flex gap-1 bg-white/5 border border-white/10 p-1 rounded-2xl">
              {[
                {
                  key: "house" as Tab,
                  label: "House Leaderboard",
                  short: "Leaders",
                  Icon: Trophy,
                },
                {
                  key: "individual" as Tab,
                  label: "Individual",
                  short: "Individual",
                  Icon: User,
                },
                {
                  key: "housewise" as Tab,
                  label: "House-wise",
                  short: "House-wise",
                  Icon: BarChart2,
                },
              ].map(({ key, label, short, Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex-1 sm:flex-none flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-5 py-2.5 sm:py-2.5 rounded-xl text-[9px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                    activeTab === key
                      ? "bg-[#BA170D] text-white shadow-lg shadow-red-900/30"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon size={13} />
                  <span className="sm:hidden leading-tight text-center">
                    {short}
                  </span>
                  <span className="hidden sm:inline whitespace-nowrap">
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tab content ── */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-20 rounded-2xl bg-white/5 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div ref={tabContentRef}>
            {/* ══════════════════════════════════════════════════════
                TAB 1 — House Leaderboard
            ══════════════════════════════════════════════════════ */}
            {activeTab === "house" && (
              <div className="space-y-10">
                {/* Podium cards — 1 col → 2 col → 4 col */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {scores.map((hs, idx) => {
                    const meta = HOUSE_META[hs.house] ?? {
                      accent: "text-white",
                      glow: "bg-white/5",
                      bar: "bg-white/40",
                      badge: "border-white/10 bg-white/5 text-white",
                      ring: "",
                      bg: "bg-white/5",
                    };
                    const pct = Math.round((hs.total / maxScore) * 100);

                    return (
                      <div
                        key={hs.house}
                        className={`anim-card relative rounded-2xl border border-white/8 bg-white/[0.03] p-4 sm:p-5 flex flex-col gap-3 overflow-hidden group hover:border-white/20 transition-colors duration-500 ${
                          idx === 0 ? "ring-1 ring-yellow-400/30" : ""
                        }`}
                      >
                        <div
                          className={`absolute -top-8 -right-8 w-28 h-28 rounded-full blur-2xl opacity-25 group-hover:opacity-40 transition-opacity ${meta.glow}`}
                        />

                        {/* Rank + crown */}
                        <div className="flex items-center justify-between relative z-10">
                          <span
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black ${
                              RANK_NUM_BG[idx] ?? "bg-white/10 text-white"
                            }`}
                          >
                            {idx + 1}
                          </span>
                          {idx === 0 && (
                            <Crown size={16} className="text-yellow-400" />
                          )}
                        </div>

                        <p
                          className={`text-xs font-black uppercase tracking-widest relative z-10 ${meta.accent}`}
                        >
                          {hs.house}
                        </p>

                        <p className="text-3xl sm:text-4xl font-black font-unbounded text-white relative z-10 leading-none">
                          {hs.total}
                          <span className="text-sm text-gray-500 font-normal ml-1">
                            pts
                          </span>
                        </p>

                        {/* Animated bar */}
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden relative z-10">
                          <div
                            className={`anim-bar h-full rounded-full ${meta.bar}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        {/* Medal counts */}
                        <div className="grid grid-cols-3 gap-1 text-[10px] text-gray-500 relative z-10 pt-1 border-t border-white/5">
                          {PLACE_ICONS.map(({ Icon, color }, pi) => (
                            <span
                              key={pi}
                              className="flex items-center justify-center gap-1"
                            >
                              <Icon size={10} className={color} />
                              {
                                [
                                  hs.firstPlaces,
                                  hs.secondPlaces,
                                  hs.thirdPlaces,
                                ][pi]
                              }
                            </span>
                          ))}
                        </div>

                        {/* +/- */}
                        <div className="grid grid-cols-2 gap-1 text-[10px] relative z-10">
                          <div className="flex items-center justify-center gap-1 bg-green-500/5 rounded px-1 py-0.5 text-green-400">
                            <TrendingUp size={9} /> {hs.positive}
                          </div>
                          <div className="flex items-center justify-center gap-1 bg-red-500/5 rounded px-1 py-0.5 text-red-400">
                            <TrendingDown size={9} />{" "}
                            {hs.negative === 0 ? "—" : hs.negative}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Event winners */}
                {results.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-5 text-center">
                      Event Winners
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {results.map((r) => (
                        <div
                          key={r.eventTitle}
                          className="anim-card bg-white/[0.03] border border-white/8 rounded-xl px-4 sm:px-5 py-4 hover:border-white/20 transition-colors duration-300"
                        >
                          <p className="text-sm font-bold text-white mb-3 truncate">
                            {r.eventTitle}
                            <span className="ml-2 text-[10px] text-gray-600 font-normal capitalize">
                              {r.eventType}
                            </span>
                          </p>
                          <div className="space-y-2">
                            {PLACE_KEYS.map((place, pi) => {
                              const entry = r[place];
                              if (!entry) return null;
                              const { Icon, color } = PLACE_ICONS[pi];
                              const meta = HOUSE_META[entry.house ?? ""];
                              return (
                                <div
                                  key={place}
                                  className="flex items-center gap-2 text-xs"
                                >
                                  <Icon
                                    size={13}
                                    className={`${color} flex-shrink-0`}
                                  />
                                  <span className="text-white font-semibold truncate flex-1 capitalize">
                                    {entry.name.toLowerCase()}
                                    {entry.teamName && (
                                      <span className="text-gray-500 font-normal ml-1 lowercase">
                                        ({entry.teamName.toLowerCase()})
                                      </span>
                                    )}
                                  </span>
                                  {(entry.department || entry.semester) && (
                                    <span className="flex-shrink-0 px-1.5 py-0.5 rounded-full border border-white/10 bg-white/5 text-[10px] font-bold text-sky-400">
                                      {entry.semester
                                        ? `${entry.semester} `
                                        : ""}
                                      {entry.department === "CIVIL"
                                        ? "Civil"
                                        : entry.department === "MECH"
                                          ? "Mech"
                                          : entry.department}
                                    </span>
                                  )}
                                  {entry.house && (
                                    <span
                                      className={`flex-shrink-0 px-2 py-0.5 rounded-full border text-[10px] font-bold ${
                                        meta?.badge ??
                                        "border-white/10 bg-white/5 text-gray-400"
                                      }`}
                                    >
                                      {entry.house.replace(" House", "")}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════════════════
                TAB 2 — Individual Scoreboard
            ══════════════════════════════════════════════════════ */}
            {activeTab === "individual" && (
              <div className="space-y-3">
                {individuals.length === 0 ? (
                  <p className="text-center text-gray-500 text-sm py-12">
                    No individual results yet.
                  </p>
                ) : (
                  individuals.map((ind, idx) => {
                    const meta = HOUSE_META[ind.house] ?? {
                      accent: "text-white",
                      badge: "border-white/10 bg-white/5 text-gray-400",
                      bar: "bg-white/40",
                      ring: "",
                    };
                    const pct = Math.round(
                      (ind.totalPoints / maxIndividual) * 100,
                    );

                    return (
                      <div
                        key={`${ind.chestNo}-${idx}`}
                        className={`anim-card flex items-center gap-3 sm:gap-4 bg-white/[0.03] border border-white/8 rounded-2xl px-3 sm:px-5 py-3 sm:py-4 hover:border-white/15 transition-colors duration-300 ${
                          idx < 3 ? "ring-1 " + meta.ring : ""
                        }`}
                      >
                        {/* Rank badge */}
                        <span
                          className={`flex-shrink-0 inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full text-sm font-black ${
                            RANK_NUM_BG[idx] ?? "bg-white/10 text-white"
                          }`}
                        >
                          {idx + 1}
                        </span>

                        {/* Info block */}
                        <div className="flex-1 min-w-0">
                          {/* Name row */}
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-1.5">
                            <span className="text-white font-bold text-sm truncate capitalize">
                              {ind.name.toLowerCase()}
                            </span>
                            {ind.teamName && (
                              <span className="text-gray-500 text-xs hidden sm:inline lowercase">
                                ({ind.teamName.toLowerCase()})
                              </span>
                            )}
                            {ind.chestNo && (
                              <span className="text-gray-600 text-xs font-mono">
                                #{ind.chestNo}
                              </span>
                            )}
                            {ind.house && (
                              <span
                                className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${meta.badge}`}
                              >
                                {ind.house.replace(" House", "")}
                              </span>
                            )}
                            {(ind.department || ind.semester) && (
                              <span className="px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-[10px] font-bold text-sky-400">
                                {ind.semester ? `${ind.semester} ` : ""}
                                {ind.department === "CIVIL"
                                  ? "Civil"
                                  : ind.department === "MECH"
                                    ? "Mech"
                                    : ind.department}
                              </span>
                            )}
                          </div>

                          {/* Win pills — hidden on very small screens */}
                          <div className="hidden sm:flex flex-wrap gap-1.5 mb-2">
                            {ind.wins.map((w, wi) => {
                              const pi = PLACE_KEYS.indexOf(w.place);
                              const { Icon, color } =
                                PLACE_ICONS[pi] ?? PLACE_ICONS[2];
                              return (
                                <span
                                  key={wi}
                                  className="inline-flex items-center gap-1 text-[10px] bg-white/5 border border-white/8 rounded-full px-2 py-0.5 text-gray-400"
                                >
                                  <Icon size={9} className={color} />
                                  {w.eventTitle}
                                  <span className="text-green-400 ml-0.5">
                                    +{w.pts}
                                  </span>
                                </span>
                              );
                            })}
                          </div>

                          {/* Points bar */}
                          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className={`anim-bar h-full rounded-full ${meta.bar}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>

                        {/* Score */}
                        <div className="text-right flex-shrink-0">
                          <p
                            className={`text-xl sm:text-2xl font-black font-unbounded leading-none ${meta.accent}`}
                          >
                            {ind.totalPoints}
                          </p>
                          <p className="text-[10px] text-gray-600 mt-0.5">
                            pts
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════════════════
                TAB 3 — House-wise Breakdown
            ══════════════════════════════════════════════════════ */}
            {activeTab === "housewise" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {houseDetails.map((hd, idx) => {
                  const meta = HOUSE_META[hd.house] ?? {
                    accent: "text-white",
                    glow: "bg-white/5",
                    badge: "border-white/10 bg-white/5 text-gray-400",
                    ring: "",
                    bg: "bg-white/5",
                    bar: "bg-white/40",
                  };
                  return (
                    <div
                      key={hd.house}
                      className={`anim-card relative rounded-2xl border border-white/8 overflow-hidden ${
                        idx === 0 ? "ring-1 ring-yellow-400/20" : ""
                      }`}
                    >
                      {/* House header */}
                      <div
                        className={`px-4 sm:px-6 py-4 flex items-center justify-between ${meta.bg} border-b border-white/8`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black ${
                              RANK_NUM_BG[idx] ?? "bg-white/10 text-white"
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <div>
                            <p
                              className={`font-black uppercase tracking-wider text-sm ${meta.accent}`}
                            >
                              {hd.house}
                            </p>
                            <p className="text-xs text-gray-500">
                              {hd.wins.length} event win
                              {hd.wins.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-2xl sm:text-3xl font-black font-unbounded ${meta.accent}`}
                          >
                            {hd.total}
                          </p>
                          <div className="flex gap-2 text-[10px] mt-0.5 justify-end">
                            <span className="flex items-center gap-0.5 text-green-400">
                              <TrendingUp size={9} /> {hd.positiveTotal}
                            </span>
                            {hd.negativeTotal !== 0 && (
                              <span className="flex items-center gap-0.5 text-red-400">
                                <TrendingDown size={9} /> {hd.negativeTotal}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Wins list */}
                      <div className="px-4 sm:px-6 py-4 bg-white/[0.02] space-y-2">
                        {hd.wins.length === 0 ? (
                          <p className="text-xs text-gray-600 py-2 text-center">
                            No event wins yet
                          </p>
                        ) : (
                          hd.wins.map((w, wi) => {
                            const pi = PLACE_KEYS.indexOf(w.place);
                            const { Icon, color } =
                              PLACE_ICONS[pi] ?? PLACE_ICONS[2];
                            return (
                              <div
                                key={wi}
                                className="flex items-center gap-3 text-xs py-1 border-b border-white/4 last:border-none"
                              >
                                <Icon
                                  size={13}
                                  className={`${color} flex-shrink-0`}
                                />
                                <span className="flex-1 text-white truncate">
                                  {w.eventTitle}
                                </span>
                                <span className="text-gray-600 flex-shrink-0 capitalize text-[10px] hidden sm:block">
                                  {w.eventType}
                                </span>
                                <span className="text-green-400 font-bold font-mono flex-shrink-0">
                                  +{w.pts}
                                </span>
                              </div>
                            );
                          })
                        )}

                        {/* Negative markings */}
                        {hd.negativeMarkings.length > 0 && (
                          <div className="pt-3 mt-2 border-t border-white/5 space-y-1.5">
                            <p className="text-[10px] text-red-400/60 uppercase tracking-widest font-bold mb-2 flex items-center gap-1">
                              <MinusCircle size={9} /> Negative Markings
                            </p>
                            {hd.negativeMarkings.map((nm) => (
                              <div
                                key={nm.id}
                                className="flex items-start gap-2 text-xs py-0.5"
                              >
                                <TrendingDown
                                  size={11}
                                  className="text-red-400 flex-shrink-0 mt-0.5"
                                />
                                <span className="text-red-400 font-mono font-bold flex-shrink-0">
                                  {nm.marks}
                                </span>
                                <span className="text-gray-500 truncate flex-1">
                                  {nm.offense}
                                </span>
                                {nm.eventTitle && (
                                  <span className="text-gray-600 text-[10px] flex-shrink-0 italic hidden sm:block">
                                    {nm.eventTitle}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
