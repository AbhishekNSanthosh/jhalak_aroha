"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";

export default function SplashScreen({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const textTitleRef = useRef<HTMLDivElement>(null);
  const textSubtitleRef = useRef<HTMLDivElement>(null);
  const progressContainerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const creditsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: onComplete,
      });

      // 1. Initial State
      gsap.set(containerRef.current, { clipPath: "inset(0% 0% 0% 0%)" });

      // Glitch/Flash Logo Input
      tl.fromTo(
        logoRef.current,
        { scale: 2, opacity: 0, filter: "blur(20px)" },
        {
          scale: 1,
          opacity: 1,
          filter: "blur(0px)",
          duration: 1,
          ease: "expo.out",
        },
      )
        // Jitter/Shake Effect
        .to(
          logoRef.current,
          {
            x: 5,
            y: -5,
            duration: 0.05,
            repeat: 5,
            yoyo: true,
            ease: "none",
            onComplete: () => {
              gsap.set(logoRef.current, { x: 0, y: 0 });
            },
          },
          "-=0.5",
        )

        // Text Reveal
        .fromTo(
          textTitleRef.current,
          { opacity: 0, scale: 1.5, text: "" }, // Requires TextPlugin, but standard GSAP can do scale/opacity
          {
            opacity: 1,
            scale: 1,
            duration: 0.8,
            ease: "back.out(1.7)",
          },
          "-=0.2",
        );

      // Subtitle Reveal
      tl.fromTo(
        textSubtitleRef.current,
        { opacity: 0, letterSpacing: "2em" },
        { opacity: 1, letterSpacing: "0.8em", duration: 0.8 },
        "-=0.4",
      ).fromTo(
        creditsRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
        "-=0.6",
      );

      // 3. Progress Bar Animation
      tl.fromTo(
        progressBarRef.current,
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1.5,
          ease: "expo.inOut",
          transformOrigin: "left center",
        },
        "<", // start with text reveal
      );

      // 4. Exit Sequence
      tl.to(
        [
          logoRef.current,
          textTitleRef.current,
          textSubtitleRef.current,
          progressContainerRef.current,
          creditsRef.current,
        ],
        {
          y: -50,
          opacity: 0,
          duration: 0.6,
          ease: "power2.in",
          stagger: 0.1,
        },
        "+=0.2",
      ).to(
        containerRef.current,
        {
          clipPath: "inset(0% 0% 100% 0%)", // Wipes up
          duration: 0.8,
          ease: "expo.inOut",
        },
        "-=0.2",
      );
    }, containerRef);

    return () => ctx.revert();
  }, [onComplete]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-[#000000] flex flex-col items-center justify-center text-center pointer-events-auto"
    >
      {/* Background Texture/Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#050505] to-[#0A0A0A] pointer-events-none"></div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo */}
        <div ref={logoRef} className="relative w-32 h-32 md:w-48 md:h-48 mb-8">
          {/* Glow behind logo */}
          <div className="absolute inset-0 bg-[#BA170D] rounded-full blur-[80px] opacity-20 animate-pulse"></div>
          <Image
            src="/Logo.png"
            alt="Jhalak Aroha"
            fill
            className="object-contain drop-shadow-2xl"
            priority
          />
        </div>

        {/* Text */}
        <h1
          ref={textTitleRef}
          className="text-4xl md:text-7xl font-cinzel font-black text-white mb-2"
        >
          AROHA
        </h1>
        <p
          ref={textSubtitleRef}
          className="text-[#BA170D] font-geist-mono text-xs md:text-sm tracking-[0.8em] uppercase mb-12"
        >
          JHALAK 2026
        </p>

        {/* Progress Bar */}
        <div
          ref={progressContainerRef}
          className="w-64 h-[2px] bg-white/10 rounded-full overflow-hidden relative"
        >
          <div
            ref={progressBarRef}
            className="absolute inset-0 bg-[#BA170D] w-full h-full origin-left"
          ></div>
        </div>
      </div>

      {/* Credits */}
      <div
        ref={creditsRef}
        className="absolute bottom-8 left-0 right-0 text-center z-20 opacity-0"
      >
        <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-widest font-mono">
          Crafted with <span className="text-white mx-1">♥</span> by{" "}
          <Link
            href="/tech-team"
            className="text-[#BA170D] font-bold animate-pulse ml-1 hover:underline z-50 cursor-pointer relative"
          >
            Tech Team
          </Link>
        </p>
      </div>
    </div>
  );
}
