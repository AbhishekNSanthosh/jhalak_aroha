"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Results from "@/components/Results";

// ── helpers ───────────────────────────────────────────────────────────────────
const TITLE_LINE1 = "EVENT";
const TITLE_LINE2 = "RESULTS";

// ── Splash Screen ─────────────────────────────────────────────────────────────
function ResultsSplash({ onDone }: { onDone: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const logoWrapRef = useRef<HTMLDivElement>(null);
  const line1Ref = useRef<HTMLDivElement>(null); // framing line top
  const line2Ref = useRef<HTMLDivElement>(null); // framing line bottom
  const letters1Ref = useRef<HTMLSpanElement[]>([]);
  const letters2Ref = useRef<HTMLSpanElement[]>([]);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const progressTrack = useRef<HTMLDivElement>(null);
  const progressFill = useRef<HTMLDivElement>(null);
  const creditRef = useRef<HTMLAnchorElement>(null);
  const heartRef = useRef<HTMLSpanElement>(null);
  const techTeamRef = useRef<HTMLSpanElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    letters1Ref.current = letters1Ref.current.slice(0, TITLE_LINE1.length);
    letters2Ref.current = letters2Ref.current.slice(0, TITLE_LINE2.length);

    const ctx = gsap.context(() => {
      // ── Set initial states ──────────────────────────────────────────────────
      gsap.set(glowRef.current, { scale: 0, autoAlpha: 0 });
      gsap.set([line1Ref.current, line2Ref.current], {
        scaleX: 0,
        transformOrigin: "center",
      });
      gsap.set(logoWrapRef.current, {
        autoAlpha: 0,
        scale: 1.4,
        filter: "blur(20px)",
      });
      gsap.set([...letters1Ref.current, ...letters2Ref.current], {
        y: -70,
        autoAlpha: 0,
      });
      gsap.set(
        [subtitleRef.current, progressTrack.current, creditRef.current],
        { autoAlpha: 0, y: 16 },
      );

      // ── Main entrance timeline ──────────────────────────────────────────────
      const tl = gsap.timeline({
        onComplete: () => {
          gsap.delayedCall(0.5, () => {
            // Elegant fade out
            gsap.to(containerRef.current, {
              autoAlpha: 0,
              duration: 1.2,
              ease: "power2.inOut",
              onComplete: onDone,
            });
          });
        },
      });

      // 0.0s — Central glow expands (subtler)
      tl.to(
        glowRef.current,
        { scale: 1, autoAlpha: 0.6, duration: 2, ease: "power2.out" },
        0,
      );

      // 0.4s — Logo unblurs from scale 1.1 → 1 (gentle focus pull)
      tl.to(
        logoWrapRef.current,
        {
          autoAlpha: 1,
          scale: 1,
          filter: "blur(0px)",
          duration: 1.5,
          ease: "power2.out",
        },
        0.4,
      );

      // 0.8s — Framing lines extend outward slowly
      tl.to(
        line1Ref.current,
        { scaleX: 1, duration: 1.2, ease: "power3.out" },
        0.8,
      );
      tl.to(
        line2Ref.current,
        { scaleX: 1, duration: 1.2, ease: "power3.out" },
        0.9,
      );

      // 1.0s — "EVENT" letters slide up smoothly
      gsap.set(letters1Ref.current, { y: 20, autoAlpha: 0 });
      tl.to(
        letters1Ref.current,
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.8,
          stagger: 0.08,
          ease: "power3.out",
        },
        1.0,
      );

      // 1.35s — "RESULTS" letters slide up smoothly
      gsap.set(letters2Ref.current, { y: 20, autoAlpha: 0 });
      tl.to(
        letters2Ref.current,
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.8,
          stagger: 0.08,
          ease: "power3.out",
        },
        1.35,
      );

      // 1.8s — Subtitle + progress track fade in
      tl.to(
        [subtitleRef.current, progressTrack.current],
        {
          autoAlpha: 1,
          y: 0,
          duration: 1,
          stagger: 0.15,
          ease: "power2.out",
        },
        1.8,
      );

      // 2.0s — Progress bar fills
      tl.fromTo(
        progressFill.current,
        { width: "0%" },
        { width: "100%", duration: 1.5, ease: "power1.inOut" },
        2.0,
      );

      // 2.2s — Credit
      tl.to(
        creditRef.current,
        { autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out" },
        2.2,
      );

      // ── Perpetual loops ──────────────────────────────────────────────────────

      // Glow breathe
      gsap.to(glowRef.current, {
        scale: 1.12,
        duration: 3.5,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });

      // Logo gentle float
      gsap.to(logoWrapRef.current, {
        y: -8,
        duration: 3.2,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });

      // Heart beat
      gsap.to(heartRef.current, {
        scale: 1.4,
        duration: 0.3,
        yoyo: true,
        repeat: -1,
        repeatDelay: 0.7,
        ease: "power1.inOut",
      });

      // TECH TEAM pulse
      gsap.to(techTeamRef.current, {
        opacity: 0.55,
        duration: 0.85,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });
    }, containerRef);

    return () => ctx.revert();
  }, [onDone]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden bg-[#000]"
    >
      {/* Radial background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,_#1c0101_0%,_#000_100%)]" />

      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #BA170D 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Central glow */}
      <div
        ref={glowRef}
        className="absolute rounded-full pointer-events-none"
        style={{
          width: "min(500px, 90vw)",
          height: "min(500px, 90vw)",
          background:
            "radial-gradient(circle, rgba(186,23,13,0.22) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      {/* ── Main content ── */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo — focus-pull entrance */}
        <div
          ref={logoWrapRef}
          className="relative mb-6 sm:mb-8"
          style={{
            width: "clamp(56px, 16vw, 112px)",
            height: "clamp(56px, 16vw, 112px)",
            filter: "drop-shadow(0 0 32px rgba(186,23,13,0.7))",
          }}
        >
          <Image
            src="/Logo.png"
            alt="Jhalak Aroha"
            fill
            className="object-contain mix-blend-screen"
            priority
          />
        </div>

        {/* Framing line — TOP */}
        <div
          ref={line1Ref}
          className="w-[min(360px,80vw)] h-px mb-5 sm:mb-6"
          style={{
            background:
              "linear-gradient(90deg, transparent, #BA170D 30%, #ff6b5b 50%, #BA170D 70%, transparent)",
          }}
        />

        {/* Title line 1 — EVENT */}
        <div className="flex items-end justify-center gap-[0.05em] overflow-hidden">
          {TITLE_LINE1.split("").map((ch, i) => (
            <span
              key={i}
              ref={(el) => {
                if (el) letters1Ref.current[i] = el;
              }}
              className="inline-block font-black text-white"
              style={{
                fontFamily: "var(--font-poppins)",
                fontSize: "clamp(2rem, 9vw, 4.5rem)",
                lineHeight: 1,
                letterSpacing: "0.15em",
                display: "inline-block",
              }}
            >
              {ch}
            </span>
          ))}
        </div>

        {/* Title line 2 — RESULTS */}
        <div className="flex items-end justify-center gap-[0.05em] overflow-hidden mt-1">
          {TITLE_LINE2.split("").map((ch, i) => (
            <span
              key={i}
              ref={(el) => {
                if (el) letters2Ref.current[i] = el;
              }}
              className="inline-block font-black"
              style={{
                fontFamily: "var(--font-poppins)",
                fontSize: "clamp(2.2rem, 10vw, 5rem)",
                lineHeight: 1,
                letterSpacing: "0.2em",
                color: "#BA170D",
                display: "inline-block",
              }}
            >
              {ch}
            </span>
          ))}
        </div>

        {/* Framing line — BOTTOM */}
        <div
          ref={line2Ref}
          className="w-[min(360px,80vw)] h-px mt-5 sm:mt-6"
          style={{
            background:
              "linear-gradient(90deg, transparent, #BA170D 30%, #ff6b5b 50%, #BA170D 70%, transparent)",
          }}
        />

        {/* Subtitle */}
        <p
          ref={subtitleRef}
          className="mt-4 sm:mt-5 font-mono uppercase text-center"
          style={{
            fontSize: "clamp(8px, 2vw, 11px)",
            letterSpacing: "0.35em",
            color: "rgba(255,255,255,0.35)",
          }}
        >
          Scoreboard · Arts · Jhalak 2026
        </p>

        {/* Progress bar */}
        <div
          ref={progressTrack}
          className="mt-6 sm:mt-8 rounded-full overflow-hidden"
          style={{
            width: "clamp(120px, 40vw, 260px)",
            height: "2px",
            background: "rgba(186,23,13,0.15)",
          }}
        >
          <div
            ref={progressFill}
            className="h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, #7a0d07, #BA170D, #ff6b5b)",
              boxShadow: "0 0 12px #BA170D, 0 0 4px #ff6b5b",
              width: "0%",
            }}
          />
        </div>
      </div>

      {/* Credit — bottom */}
      <Link
        ref={creditRef}
        href="/tech-team"
        className="absolute bottom-5 sm:bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1 sm:gap-1.5 uppercase font-mono select-none z-20 whitespace-nowrap group"
        style={{
          fontSize: "clamp(9px, 2.2vw, 11px)",
          letterSpacing: "0.18em",
          color: "rgba(255,255,255,0.3)",
        }}
      >
        <span className="group-hover:text-white/60 transition-colors duration-300">
          Crafted with
        </span>
        <span
          ref={heartRef}
          className="inline-block"
          style={{
            fontSize: "clamp(12px, 3vw, 15px)",
            display: "inline-block",
          }}
        >
          🤍
        </span>
        <span className="group-hover:text-white/60 transition-colors duration-300">
          by
        </span>
        <span
          ref={techTeamRef}
          className="font-black group-hover:opacity-100 transition-opacity duration-300"
          style={{
            color: "#BA170D",
            textShadow:
              "0 0 10px rgba(186,23,13,0.9), 0 0 4px rgba(255,80,60,0.5)",
          }}
        >
          TECH TEAM
        </span>
      </Link>

      {/* Film grain */}
      <div className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-[0.07]">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <filter id="rGrain2">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.85"
              numOctaves="3"
              stitchTiles="stitch"
            />
          </filter>
          <rect width="100%" height="100%" filter="url(#rGrain2)" />
        </svg>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ResultsPage() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      {showSplash && <ResultsSplash onDone={() => setShowSplash(false)} />}

      <main
        className="bg-[#0A0A0A] min-h-screen text-white overflow-hidden selection:bg-[#BA170D] selection:text-white"
        style={{ visibility: showSplash ? "hidden" : "visible" }}
      >
        <Navbar />
        <div className="pt-28">
          <Results standalone />
        </div>
        <Footer />
      </main>
    </>
  );
}
