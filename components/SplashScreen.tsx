"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";

// --- Particle helper ---
interface Particle {
  el: HTMLDivElement;
  angle: number;
  radius: number;
  size: number;
}

export default function SplashScreen({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const logoWrapRef = useRef<HTMLDivElement>(null);
  const ring1Ref = useRef<HTMLDivElement>(null);
  const ring2Ref = useRef<HTMLDivElement>(null);
  const ring3Ref = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const progressWrapRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const creditsRef = useRef<HTMLDivElement>(null);
  const particlePoolRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const scanlineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      /* ── 0. Reset visibility ── */
      gsap.set(
        [
          logoWrapRef.current,
          ring1Ref.current,
          ring2Ref.current,
          ring3Ref.current,
          titleRef.current,
          subtitleRef.current,
          progressWrapRef.current,
          creditsRef.current,
        ],
        { autoAlpha: 0 },
      );

      /* ── 1. Spawn floating particles ── */
      const pool = particlePoolRef.current!;
      const particles: Particle[] = Array.from({ length: 28 }, () => {
        const el = document.createElement("div");
        const size = Math.random() * 4 + 2;
        const angle = Math.random() * 360;
        const radius = 90 + Math.random() * 80;
        el.style.cssText = `
          position:absolute;
          width:${size}px;
          height:${size}px;
          border-radius:50%;
          background:${"#BA170D"};
          opacity:0;
          top:50%;left:50%;
          transform:translate(-50%,-50%);
          pointer-events:none;
        `;
        pool.appendChild(el);
        gsap.set(el, {
          x: Math.cos((angle * Math.PI) / 180) * radius,
          y: Math.sin((angle * Math.PI) / 180) * radius,
        });
        return { el, angle, radius, size };
      });

      // Animate all particles in a looped orbit + twinkle
      particles.forEach(({ el, angle, radius }) => {
        gsap.to(el, {
          opacity: 0.7,
          duration: 0.6,
          delay: Math.random() * 1,
        });
        gsap.to(el, {
          motionPath: undefined,
          rotation: 360,
          transformOrigin: `${-radius}px 0px`,
          duration: 6 + Math.random() * 6,
          ease: "none",
          repeat: -1,
          delay: Math.random() * 4,
        });
        gsap.to(el, {
          opacity: 0,
          duration: 0.8 + Math.random() * 0.5,
          yoyo: true,
          repeat: -1,
          delay: Math.random() * 3,
        });
      });

      /* ── 2. Master timeline ── */
      const tl = gsap.timeline({ onComplete });

      // Scanline sweep
      tl.fromTo(
        scanlineRef.current,
        { scaleY: 0, autoAlpha: 1 },
        { scaleY: 1, duration: 0.5, ease: "expo.out", transformOrigin: "top" },
      ).to(scanlineRef.current, { autoAlpha: 0, duration: 0.3 }, "+=0.1");

      // Glow pulse into existence
      tl.fromTo(
        glowRef.current,
        { scale: 0, autoAlpha: 0 },
        { scale: 1, autoAlpha: 1, duration: 1, ease: "expo.out" },
        "-=0.5",
      );

      // Logo entrance — scale-drop with spring bounce
      tl.fromTo(
        logoWrapRef.current,
        { scale: 3, autoAlpha: 0, filter: "blur(30px) brightness(3)" },
        {
          scale: 1,
          autoAlpha: 1,
          filter: "blur(0px) brightness(1)",
          duration: 1.1,
          ease: "back.out(1.4)",
        },
        "-=0.7",
      );

      // Rings explode outward
      [ring1Ref, ring2Ref, ring3Ref].forEach((ref, i) => {
        tl.fromTo(
          ref.current,
          { scale: 0, autoAlpha: 0 },
          {
            scale: 1,
            autoAlpha: 0.6 - i * 0.15,
            duration: 0.7,
            ease: "expo.out",
          },
          `-=0.${8 - i * 2}`,
        );
        // Continuous slow spin
        gsap.to(ref.current, {
          rotation: i % 2 === 0 ? 360 : -360,
          duration: 8 + i * 4,
          ease: "none",
          repeat: -1,
        });
      });

      // Glitch title reveal
      if (titleRef.current) {
        const originalText = titleRef.current.textContent || "";
        const glitchChars = "!@#$%^&*ABCDEFGHIJKLMNOPQRSTUVWXYZароха";
        let iteration = 0;
        const totalFrames = 18;

        tl.to(
          {},
          {
            duration: 0.8,
            onStart: () => {
              gsap.set(titleRef.current, { autoAlpha: 1 });
            },
            onUpdate: function () {
              const progress = this.progress();
              iteration = Math.floor(progress * totalFrames);
              if (titleRef.current) {
                titleRef.current.textContent = originalText
                  .split("")
                  .map((char, idx) => {
                    if (char === " ") return " ";
                    if (idx < iteration) return char;
                    return glitchChars[
                      Math.floor(Math.random() * glitchChars.length)
                    ];
                  })
                  .join("");
              }
            },
            onComplete: () => {
              if (titleRef.current) titleRef.current.textContent = originalText;
            },
            ease: "none",
          },
          "-=0.2",
        );
      }

      // Subtitle letter spacing expand + fade in
      tl.fromTo(
        subtitleRef.current,
        { autoAlpha: 0, letterSpacing: "3em", x: -20 },
        {
          autoAlpha: 1,
          letterSpacing: "0.8em",
          x: 0,
          duration: 0.9,
          ease: "power3.out",
        },
        "-=0.4",
      );

      // Progress bar
      tl.fromTo(
        progressWrapRef.current,
        { autoAlpha: 0, y: 10 },
        { autoAlpha: 1, y: 0, duration: 0.4 },
        "-=0.4",
      ).fromTo(
        progressBarRef.current,
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1.4,
          ease: "expo.inOut",
          transformOrigin: "left center",
        },
        "<",
      );

      // Credits fade in
      tl.fromTo(
        creditsRef.current,
        { autoAlpha: 0, y: 12 },
        { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" },
        "-=1",
      );

      // ── Exit: elements scatter upward then container wipes down ──
      tl.to(
        [
          logoWrapRef.current,
          ring1Ref.current,
          ring2Ref.current,
          ring3Ref.current,
          titleRef.current,
          subtitleRef.current,
          progressWrapRef.current,
          creditsRef.current,
          glowRef.current,
        ],
        {
          y: -40,
          autoAlpha: 0,
          stagger: 0.05,
          duration: 0.5,
          ease: "power3.in",
        },
        "+=0.3",
      ).to(
        containerRef.current,
        {
          clipPath: "inset(100% 0% 0% 0%)",
          duration: 0.9,
          ease: "expo.inOut",
        },
        "-=0.15",
      );
    }, containerRef);

    return () => ctx.revert();
  }, [onComplete]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center text-center pointer-events-auto overflow-hidden"
      style={{ clipPath: "inset(0% 0% 0% 0%)" }}
    >
      {/* ── Deep background ── */}
      <div className="absolute inset-0 bg-[#050505]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#1a0202_0%,_#000000_70%)]" />

      {/* ── Grid overlay ── */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(#BA170D 1px, transparent 1px), linear-gradient(90deg, #BA170D 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* ── Scanline sweep ── */}
      <div
        ref={scanlineRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, transparent 0%, rgba(186,23,13,0.08) 50%, transparent 100%)",
          opacity: 0,
        }}
      />

      {/* ── Particle orbit pool ── */}
      <div
        ref={particlePoolRef}
        className="absolute inset-0 pointer-events-none"
      />

      {/* ── Central glow ── */}
      <div
        ref={glowRef}
        className="absolute w-[300px] h-[300px] md:w-[420px] md:h-[420px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(186,23,13,0.25) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* ── Rings ── */}
      <div
        ref={ring1Ref}
        className="absolute w-[220px] h-[220px] md:w-[320px] md:h-[320px] rounded-full pointer-events-none"
        style={{
          border: "1px solid rgba(186,23,13,0.5)",
          boxShadow:
            "0 0 20px rgba(186,23,13,0.3), inset 0 0 20px rgba(186,23,13,0.1)",
        }}
      />
      <div
        ref={ring2Ref}
        className="absolute w-[310px] h-[310px] md:w-[430px] md:h-[430px] rounded-full pointer-events-none"
        style={{
          border: "1px dashed rgba(186,23,13,0.3)",
        }}
      />
      <div
        ref={ring3Ref}
        className="absolute w-[400px] h-[400px] md:w-[560px] md:h-[560px] rounded-full pointer-events-none"
        style={{
          border: "1px solid rgba(186,23,13,0.1)",
        }}
      />

      {/* ── Main content ── */}
      <div className="relative z-10 flex flex-col items-center gap-0">
        {/* Logo */}
        <div
          ref={logoWrapRef}
          className="relative w-36 h-36 md:w-52 md:h-52 mb-7"
          style={{ filter: "drop-shadow(0 0 30px rgba(186,23,13,0.5))" }}
        >
          <Image
            src="/Logo.png"
            alt="Jhalak Aroha"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Title with glitch effect */}
        <h1
          ref={titleRef}
          className="text-5xl md:text-8xl font-cinzel font-black text-white tracking-widest"
          style={{
            textShadow:
              "0 0 40px rgba(186,23,13,0.6), 0 0 80px rgba(186,23,13,0.3)",
          }}
        >
          AROHA
        </h1>

        {/* Subtitle */}
        <p
          ref={subtitleRef}
          className="text-[#BA170D] font-mono text-[10px] md:text-xs tracking-[0.8em] uppercase mt-3 mb-10"
        >
          JHALAK 2026
        </p>

        {/* Progress bar */}
        <div
          ref={progressWrapRef}
          className="w-56 md:w-72 h-[2px] rounded-full overflow-hidden relative"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          {/* Glow shimmer on bar */}
          <div
            ref={progressBarRef}
            className="absolute inset-0 w-full h-full origin-left"
            style={{
              background:
                "linear-gradient(90deg, #7a0d07, #BA170D, #ff3b2f, #BA170D)",
              boxShadow: "0 0 12px rgba(186,23,13,0.8)",
            }}
          />
        </div>
      </div>

      {/* ── Credits ── */}
      <div
        ref={creditsRef}
        className="absolute bottom-7 left-0 right-0 text-center z-20"
      >
        <p className="text-[10px] md:text-xs text-gray-600 uppercase tracking-widest font-mono">
          Crafted with <span className="text-white mx-1">♥</span> by{" "}
          <Link
            href="/tech-team"
            className="text-[#BA170D] font-bold hover:underline relative z-50"
          >
            Tech Team
          </Link>
        </p>
      </div>
    </div>
  );
}
