"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function OfflineScreen() {
  const containerRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const ring1Ref = useRef<HTMLDivElement>(null);
  const ring2Ref = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<(HTMLDivElement | null)[]>([]);
  const waveRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Initial states
      gsap.set([titleRef.current, subtitleRef.current, btnRef.current], {
        autoAlpha: 0,
        y: 24,
      });
      gsap.set(iconRef.current, { autoAlpha: 0, scale: 0.5 });
      gsap.set([ring1Ref.current, ring2Ref.current], {
        scale: 0,
        autoAlpha: 0,
      });

      // Master entrance timeline
      const tl = gsap.timeline({ delay: 0.15 });

      // Icon pops in
      tl.to(iconRef.current, {
        autoAlpha: 1,
        scale: 1,
        duration: 0.7,
        ease: "back.out(2)",
      })
        // Rings explode outward
        .to(
          ring1Ref.current,
          { scale: 1, autoAlpha: 1, duration: 0.6, ease: "expo.out" },
          "-=0.4",
        )
        .to(
          ring2Ref.current,
          { scale: 1, autoAlpha: 1, duration: 0.8, ease: "expo.out" },
          "-=0.5",
        )
        // Title slides up
        .to(
          titleRef.current,
          { autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out" },
          "-=0.3",
        )
        // Subtitle slides up
        .to(
          subtitleRef.current,
          { autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out" },
          "-=0.4",
        )
        // Button slides up
        .to(
          btnRef.current,
          { autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out" },
          "-=0.3",
        );

      // Rings pulse loop
      gsap.to(ring1Ref.current, {
        scale: 1.06,
        opacity: 0.5,
        duration: 1.8,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });
      gsap.to(ring2Ref.current, {
        scale: 1.04,
        opacity: 0.25,
        duration: 2.4,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
        delay: 0.4,
      });

      // Wifi signal wave animation — bars grow in sequence
      waveRefs.current.forEach((bar, i) => {
        if (!bar) return;
        gsap.fromTo(
          bar,
          { scaleY: 0.2, opacity: 0.15 },
          {
            scaleY: 1,
            opacity: 0.9,
            duration: 0.5,
            yoyo: true,
            repeat: -1,
            ease: "power1.inOut",
            delay: i * 0.15,
          },
        );
      });

      // Floating dots orbit
      dotsRef.current.forEach((dot, i) => {
        if (!dot) return;
        const angle = (i / dotsRef.current.length) * 360;
        const radius = 130;
        gsap.set(dot, {
          x: Math.cos((angle * Math.PI) / 180) * radius,
          y: Math.sin((angle * Math.PI) / 180) * radius,
          autoAlpha: 0.5,
        });
        gsap.to(dot, {
          rotation: 360,
          transformOrigin: `${-radius}px 0px`,
          duration: 10 + i * 1.5,
          ease: "none",
          repeat: -1,
        });
        gsap.to(dot, {
          autoAlpha: 0,
          duration: 1.2,
          yoyo: true,
          repeat: -1,
          delay: i * 0.3,
        });
      });

      // Icon gentle float
      gsap.to(iconRef.current, {
        y: -10,
        duration: 2.5,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "#050505" }}
    >
      {/* Deep radial background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#160202_0%,_#000000_65%)]" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(#BA170D 1px, transparent 1px), linear-gradient(90deg, #BA170D 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      {/* Floating orbit dots */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {Array.from({ length: 14 }).map((_, i) => (
          <div
            key={i}
            ref={(el) => {
              dotsRef.current[i] = el;
            }}
            className="absolute w-[3px] h-[3px] rounded-full"
            style={{ background: "#BA170D" }}
          />
        ))}
      </div>

      {/* Glow rings */}
      <div
        ref={ring1Ref}
        className="absolute w-[230px] h-[230px] md:w-[290px] md:h-[290px] rounded-full pointer-events-none"
        style={{
          border: "1px solid rgba(186,23,13,0.45)",
          boxShadow:
            "0 0 30px rgba(186,23,13,0.2), inset 0 0 30px rgba(186,23,13,0.05)",
        }}
      />
      <div
        ref={ring2Ref}
        className="absolute w-[360px] h-[360px] md:w-[430px] md:h-[430px] rounded-full pointer-events-none"
        style={{ border: "1px dashed rgba(186,23,13,0.15)" }}
      />

      {/* Central content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 gap-0">
        {/* No-wifi SVG icon with animated bars */}
        <div
          ref={iconRef}
          className="relative flex items-end justify-center gap-[5px] mb-8 h-16"
        >
          {/* Wifi signal bars (crossed) */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ filter: "drop-shadow(0 0 18px rgba(186,23,13,0.7))" }}
          >
            <svg
              width="90"
              height="90"
              viewBox="0 0 90 90"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Strikethrough line */}
              <line
                x1="15"
                y1="15"
                x2="75"
                y2="75"
                stroke="#BA170D"
                strokeWidth="4"
                strokeLinecap="round"
              />
              {/* Wifi arcs - faded/disabled */}
              <path
                d="M10 42 C23 26, 67 26, 80 42"
                stroke="rgba(186,23,13,0.3)"
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M20 54 C29 43, 61 43, 70 54"
                stroke="rgba(186,23,13,0.4)"
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M30 65 C35 59, 55 59, 60 65"
                stroke="rgba(186,23,13,0.5)"
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
              />
              {/* Center dot */}
              <circle cx="45" cy="74" r="4" fill="#BA170D" />
            </svg>
          </div>
        </div>

        {/* Animated signal bars below icon */}
        <div className="flex items-end gap-[5px] mb-10 h-8">
          {[3, 5, 8, 11, 14].map((h, i) => (
            <div
              key={i}
              ref={(el) => {
                waveRefs.current[i] = el;
              }}
              className="w-[5px] rounded-sm origin-bottom"
              style={{
                height: `${h * 2}px`,
                background:
                  i < 2
                    ? "rgba(186,23,13,0.25)"
                    : `rgba(186,23,13,${0.3 + i * 0.1})`,
                boxShadow: i >= 2 ? "0 0 6px rgba(186,23,13,0.4)" : "none",
              }}
            />
          ))}
        </div>

        {/* Title */}
        <h1
          ref={titleRef}
          className="text-3xl md:text-5xl font-cinzel font-black text-white mb-3"
          style={{
            textShadow:
              "0 0 30px rgba(186,23,13,0.5), 0 0 60px rgba(186,23,13,0.25)",
          }}
        >
          NO CONNECTION
        </h1>

        {/* Subtitle */}
        <p
          ref={subtitleRef}
          className="text-gray-400 text-sm md:text-base font-mono max-w-xs md:max-w-sm leading-relaxed mb-10"
        >
          You appear to be offline. Check your internet connection and try
          again.
        </p>

        {/* Retry button */}
        <button
          ref={btnRef}
          onClick={() => window.location.reload()}
          className="group relative px-8 py-3 rounded-full font-mono text-sm uppercase tracking-widest text-white overflow-hidden cursor-pointer border border-[#BA170D]/40 transition-all duration-300 hover:border-[#BA170D]"
          style={{
            background:
              "linear-gradient(135deg, rgba(186,23,13,0.15) 0%, rgba(186,23,13,0.05) 100%)",
          }}
        >
          {/* Shimmer on hover */}
          <span
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{
              background:
                "linear-gradient(135deg, rgba(186,23,13,0.3) 0%, transparent 60%)",
            }}
          />
          <span className="relative z-10 flex items-center gap-2">
            {/* Refresh icon */}
            <svg
              className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Try Again
          </span>
        </button>

        {/* Status indicator */}
        <div className="flex items-center gap-2 mt-8">
          <div className="w-2 h-2 rounded-full bg-[#BA170D] animate-pulse" />
          <span className="text-[10px] text-gray-600 uppercase tracking-[0.3em] font-mono">
            Waiting for connection
          </span>
        </div>
      </div>

      {/* Credits at bottom */}
      <div className="absolute bottom-7 text-center">
        <p className="text-[10px] text-gray-700 uppercase tracking-widest font-mono">
          AROHA · Jhalak 2026
        </p>
      </div>
    </div>
  );
}
