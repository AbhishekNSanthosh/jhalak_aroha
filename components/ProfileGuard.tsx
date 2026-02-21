"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { isProfileComplete } from "@/data/constant";
import Image from "next/image";
import gsap from "gsap";

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/signup",
  "/privacy-policy",
  "/terms",
  "/results",
];

// ── Verifying Access Screen ─────────────────────────────────────────────────
function VerifyingScreen() {
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const ring1Ref = useRef<HTMLDivElement>(null);
  const ring2Ref = useRef<HTMLDivElement>(null);
  const ring3Ref = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const dotsRef = useRef<HTMLSpanElement[]>([]);
  const segmentRefs = useRef<HTMLDivElement[]>([]);
  const glowRef = useRef<HTMLDivElement>(null);
  const topBarRef = useRef<HTMLDivElement>(null);
  const bottomBarRef = useRef<HTMLDivElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // ── Initial states ──
      gsap.set([logoRef.current, titleRef.current, statusRef.current], {
        autoAlpha: 0,
        y: 20,
      });
      gsap.set([ring1Ref.current, ring2Ref.current, ring3Ref.current], {
        scale: 0.8, // start slightly scaled down for cinematic slow zoom
        autoAlpha: 0,
      });
      gsap.set(glowRef.current, { scale: 0, autoAlpha: 0 });
      gsap.set(titleRef.current, { letterSpacing: "1em" }); // ultra wide

      gsap.set([topBarRef.current, bottomBarRef.current], { scaleY: 0 });

      // ── Entrance timeline ──
      const tl = gsap.timeline({ delay: 0.1 });

      // Cinematic bars slide in
      tl.to(
        [topBarRef.current, bottomBarRef.current],
        {
          scaleY: 1,
          duration: 1.2,
          ease: "power3.inOut",
          transformOrigin: (i) => (i === 0 ? "top" : "bottom"),
        },
        0,
      );

      // Slow zoom in on the whole content
      tl.fromTo(
        contentWrapperRef.current,
        { scale: 1.1 },
        { scale: 1, duration: 4, ease: "power2.out" },
        0,
      );

      tl.to(
        glowRef.current,
        {
          scale: 1,
          autoAlpha: 1,
          duration: 1.5,
          ease: "power2.out",
        },
        0.5,
      )
        .to(
          ring1Ref.current,
          { scale: 1, autoAlpha: 1, duration: 1.5, ease: "power2.out" },
          0.5,
        )
        .to(
          ring2Ref.current,
          { scale: 1, autoAlpha: 1, duration: 1.5, ease: "power2.out" },
          0.7,
        )
        .to(
          ring3Ref.current,
          { scale: 1, autoAlpha: 0.6, duration: 1.5, ease: "power2.out" },
          0.9,
        )
        .to(
          logoRef.current,
          {
            autoAlpha: 1,
            y: 0,
            duration: 1.5,
            ease: "power3.out",
          },
          1,
        )
        .to(
          titleRef.current,
          {
            autoAlpha: 1,
            y: 0,
            letterSpacing: "0.4em", // animate to standard wide tracking
            duration: 2,
            ease: "power3.out",
          },
          1.2,
        )
        .to(
          statusRef.current,
          { autoAlpha: 1, y: 0, duration: 1, ease: "power3.out" },
          1.5,
        );

      // ── Ring rotations (perpetual) ──
      gsap.to(ring1Ref.current, {
        rotation: 360,
        duration: 20,
        ease: "none",
        repeat: -1,
      });
      gsap.to(ring2Ref.current, {
        rotation: -360,
        duration: 25,
        ease: "none",
        repeat: -1,
      });
      gsap.to(ring3Ref.current, {
        rotation: 360,
        duration: 30,
        ease: "none",
        repeat: -1,
      });

      // ── Glow breathe ──
      gsap.to(glowRef.current, {
        scale: 1.1,
        opacity: 0.8,
        duration: 3,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });

      // ── Logo float ──
      gsap.to(logoRef.current, {
        y: -5,
        duration: 3,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });

      // ── Radial progress segments stagger ──
      gsap.fromTo(
        segmentRefs.current,
        { opacity: 0.1 },
        {
          opacity: 1,
          duration: 0.5,
          stagger: { each: 0.1, repeat: -1, yoyo: true },
          ease: "power1.inOut",
        },
      );

      // ── Typing dots ──
      dotsRef.current.forEach((dot, i) => {
        gsap.fromTo(
          dot,
          { autoAlpha: 0 },
          {
            autoAlpha: 1,
            duration: 0.5,
            yoyo: true,
            repeat: -1,
            delay: i * 0.2,
            ease: "power1.inOut",
          },
        );
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[150] flex flex-col items-center justify-center overflow-hidden bg-black"
    >
      {/* Film Grain overlay */}
      <div className="absolute inset-0 z-[155] pointer-events-none mix-blend-overlay">
        <svg
          viewBox="0 0 200 200"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full opacity-[0.15]"
        >
          <filter id="noiseFilter">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.85"
              numOctaves="3"
              stitchTiles="stitch"
            />
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)" />
        </svg>
      </div>

      {/* Cinematic Letterbox */}
      <div
        ref={topBarRef}
        className="absolute top-0 left-0 right-0 h-[12vh] bg-black z-[160] shadow-[0_20px_40px_rgba(0,0,0,0.9)]"
      />
      <div
        ref={bottomBarRef}
        className="absolute bottom-0 left-0 right-0 h-[12vh] bg-black z-[160] shadow-[0_-20px_40px_rgba(0,0,0,0.9)]"
      />

      {/* Overall content wrapper for slow zoom */}
      <div
        ref={contentWrapperRef}
        className="relative w-full h-full flex items-center justify-center"
      >
        {/* Deep radial bg */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1a0202_0%,_#000000_80%)]" />

        {/* Cinematic Lens Flare / Soft Light Sweep */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[1px] bg-gradient-to-r from-transparent via-[#BA170D] to-transparent opacity-30 blur-[2px] transform -rotate-12 mix-blend-screen" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[2px] bg-gradient-to-r from-transparent via-white to-transparent opacity-20 blur-[1px] transform -rotate-12 mix-blend-screen" />

        {/* Grid (subtle) */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.02]"
          style={{
            backgroundImage:
              "linear-gradient(#BA170D 1px, transparent 1px), linear-gradient(90deg, #BA170D 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            backgroundPosition: "center center",
          }}
        />

        {/* Central glow */}
        <div
          ref={glowRef}
          className="absolute w-[300px] h-[300px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(186,23,13,0.15) 0%, transparent 70%)",
            filter: "blur(50px)",
          }}
        />

        {/* Ring 1 — segmented spinner */}
        <div
          ref={ring1Ref}
          className="absolute w-[200px] h-[200px] md:w-[260px] md:h-[260px] rounded-full"
        >
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full drop-shadow-[0_0_15px_rgba(186,23,13,0.5)]"
            style={{ overflow: "visible" }}
          >
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i / 12) * 360;
              const gap = 6;
              const arcLen = 360 / 12 - gap;
              return (
                <circle
                  key={i}
                  ref={(el) => {
                    if (el)
                      segmentRefs.current[i] = el as unknown as HTMLDivElement;
                  }}
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke="#BA170D"
                  strokeWidth="1.5"
                  strokeDasharray={`${(arcLen / 360) * (2 * Math.PI * 46)} ${2 * Math.PI * 46}`}
                  strokeDashoffset={`${-((angle / 360) * (2 * Math.PI * 46))}`}
                  strokeLinecap="round"
                  style={{ opacity: 0.1 + (i / 12) * 0.9 }}
                />
              );
            })}
          </svg>
        </div>

        {/* Ring 2 — dashed orbit */}
        <div
          ref={ring2Ref}
          className="absolute w-[280px] h-[280px] md:w-[360px] md:h-[360px] rounded-full pointer-events-none"
          style={{
            border: "1px dashed rgba(186,23,13,0.2)",
            boxShadow:
              "inset 0 0 30px rgba(186,23,13,0.05), 0 0 30px rgba(186,23,13,0.05)",
          }}
        />

        {/* Ring 3 — cinematic framing marks */}
        <div
          ref={ring3Ref}
          className="absolute w-[360px] h-[360px] md:w-[480px] md:h-[480px] rounded-full pointer-events-none flex items-center justify-center opacity-40"
        >
          {/* Crosshairs */}
          <div className="absolute top-0 w-[1px] h-4 bg-[#BA170D] opacity-50" />
          <div className="absolute bottom-0 w-[1px] h-4 bg-[#BA170D] opacity-50" />
          <div className="absolute left-0 w-4 h-[1px] bg-[#BA170D] opacity-50" />
          <div className="absolute right-0 w-4 h-[1px] bg-[#BA170D] opacity-50" />
          <div className="w-full h-full rounded-full border border-[rgba(186,23,13,0.1)]" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center gap-0">
          {/* Logo */}
          <div
            ref={logoRef}
            className="relative w-28 h-28 md:w-36 md:h-36 mb-8 mix-blend-screen"
            style={{ filter: "drop-shadow(0 0 25px rgba(186,23,13,0.6))" }}
          >
            <Image
              src="/Logo.png"
              alt="Jhalak Aroha"
              fill
              className="object-contain"
              priority
            />
          </div>

          {/* Title */}
          <h1
            ref={titleRef}
            className="text-2xl md:text-3xl font-cinzel font-black text-white uppercase text-center"
            style={{
              textShadow:
                "0 0 30px rgba(186,23,13,0.5), 0 0 10px rgba(255,255,255,0.2)",
            }}
          >
            Verifying Access
          </h1>

          {/* Animated dots */}
          <p
            ref={statusRef}
            className="flex items-center gap-1 mt-4 text-[#BA170D] font-mono text-xs md:text-sm tracking-[0.3em] uppercase opacity-80"
          >
            <span>Authenticating</span>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                ref={(el) => {
                  if (el) dotsRef.current[i] = el;
                }}
                className="inline-block text-[#BA170D]"
              >
                ·
              </span>
            ))}
          </p>

          {/* Cinematic Scanning bar */}
          <div
            className="mt-10 w-48 md:w-64 h-[1px] overflow-hidden relative"
            style={{ background: "rgba(186,23,13,0.2)" }}
          >
            <div
              className="absolute inset-y-0 w-32"
              style={{
                background:
                  "linear-gradient(90deg, transparent, #BA170D, transparent)",
                animation: "scanSlide 2s cubic-bezier(0.4, 0, 0.2, 1) infinite",
                boxShadow: "0 0 10px #BA170D, 0 0 5px white",
              }}
            />
          </div>

          {/* Minimal Auth Badge */}
          <div
            className="mt-8 flex items-center gap-3 px-6 py-2"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(186,23,13,0.05), transparent)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#BA170D] animate-pulse shadow-[0_0_8px_#BA170D]" />
            <span className="text-[10px] md:text-[12px] text-[#BA170D] font-mono tracking-[0.2em] uppercase opacity-80">
              Secured Connection
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#BA170D] animate-pulse delay-75 shadow-[0_0_8px_#BA170D]" />
          </div>
        </div>
      </div>

      {/* Scan animation keyframes */}
      <style>{`
        @keyframes scanSlide {
          0%   { left: -150px; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
}

// ── Profile Guard ────────────────────────────────────────────────────────────
export default function ProfileGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setChecking(false);
        return;
      }

      if (pathname === "/profile") {
        setChecking(false);
        return;
      }

      try {
        const docRef = doc(db, "users", user.uid);
        const snapshot = await getDoc(docRef);

        if (snapshot.exists()) {
          const data = snapshot.data();
          if (!isProfileComplete(data)) {
            console.log("Profile incomplete. Redirecting to /profile");
            router.push("/profile");
          }
        } else {
          router.push("/profile");
        }
      } catch (error) {
        console.error("Error checking profile:", error);
      } finally {
        setChecking(false);
      }
    });

    return () => unsubscribe();
  }, [router, pathname]);

  if (PUBLIC_ROUTES.includes(pathname)) {
    return <>{children}</>;
  }

  if (checking) {
    return <VerifyingScreen />;
  }

  return <>{children}</>;
}
