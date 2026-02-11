"use client";

import { useRef, useLayoutEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";

gsap.registerPlugin(ScrollTrigger);

const offstageEvents = [
  "Essay Writing",
  "Story Writing",
  "Poem Writing",
  "Drawing: Pencil Sketching",
  "Drawing: Water Colour",
  "Digital Painting",
  "Poster Designing",
  "Collage",
  "Calligraphy",
  "Cartoon",
  "Debate",
  "Quiz",
  "Extempore",
  "Logo Making",
  "Glass Painting",
  "Face Painting",
  "Mehendi Designing",
  "Art from Waste",
  "Caption Writing",
];

const onstageEvents = [
  "Mime",
  "Group Dance",
  "Nostalgia Dance",
  "Light Music",
  "Karaoke",
  "Step n Synchro",
  "Group Song",
  "Recitation",
  "Fancy Dress",
  "Monoact",
  "Thiruvathira",
  "Instrumental Solo",
  "Dance Solo",
  "RJying",
  "Oppana",
  "Margam Kali",
  "Fashion Show",
];

export default function JhalakEvents() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"onstage" | "offstage">("onstage");

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Section Header Animation
      gsap.from(".events-header", {
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
        },
        y: 50,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
      });

      // Animate lists on tab change
      gsap.fromTo(
        ".event-item",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.03, duration: 0.4, ease: "power2.out" },
      );
    }, containerRef);
    return () => ctx.revert();
  }, [activeTab]);

  return (
    <section
      ref={containerRef}
      className="relative bg-[#0A0A0A] text-white py-24 px-6 md:px-24 min-h-screen border-t border-white/5 overflow-hidden selection:bg-[#BA170D] selection:text-white"
    >
      {/* Background Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(30,30,30,1)_0%,rgba(10,10,10,1)_100%)] opacity-80"></div>
        <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] bg-[#BA170D]/5 rounded-full blur-[120px] mix-blend-screen"></div>
        <div className="absolute bottom-[10%] left-[-10%] w-[30vw] h-[30vw] bg-blue-900/5 rounded-full blur-[100px] mix-blend-screen"></div>
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.04]"></div>
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)] pointer-events-none opacity-30"></div>

      <div className="container mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8 events-header">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="w-6 h-[1px] bg-[#BA170D]"></span>
              <div className="flex items-center gap-6">
                <h2 className="text-[#BA170D] font-cinzel font-bold text-lg uppercase tracking-widest">
                  Internal
                </h2>
                <h2 className="text-[#BA170D] font-cinzel font-bold text-lg uppercase tracking-widest">
                  Events
                </h2>
              </div>
            </div>

            <p className="text-5xl md:text-7xl font-light tracking-tighter text-white/90">
              JHALAK{" "}
              <span className="font-serif italic text-white/40">Originals</span>
            </p>
          </div>

          {/* Custom Tab Switcher */}
          <div className="flex gap-2 p-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm">
            <button
              onClick={() => setActiveTab("onstage")}
              className={`px-8 py-3 rounded-full text-sm uppercase tracking-wider font-bold transition-all duration-300 relative overflow-hidden ${activeTab === "onstage" ? "text-white shadow-[0_0_20px_rgba(186,23,13,0.3)] bg-[#BA170D]" : "text-gray-400 hover:text-white"}`}
            >
              On-Stage
            </button>
            <button
              onClick={() => setActiveTab("offstage")}
              className={`px-8 py-3 rounded-full text-sm uppercase tracking-wider font-bold transition-all duration-300 ${activeTab === "offstage" ? "text-white shadow-[0_0_20px_rgba(186,23,13,0.3)] bg-[#BA170D]" : "text-gray-400 hover:text-white"}`}
            >
              Off-Stage
            </button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left: Description / Image (Span 5) */}
          <div className="lg:col-span-5 relative h-[500px] lg:h-[600px] rounded-sm overflow-hidden border border-white/10 group">
            {/* Dynamic Background Image */}
            <div className="absolute inset-0 transition-opacity duration-700">
              <Image
                src={activeTab === "onstage" ? "/dance.png" : "/ash_bg.png"}
                alt="Event Category"
                fill
                className="object-cover object-center opacity-60 group-hover:scale-105 transition-transform duration-1000"
              />
            </div>

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/40 to-transparent"></div>

            <div className="absolute bottom-10 left-8 right-8">
              <div className="w-12 h-1 bg-[#BA170D] mb-6"></div>
              <h3 className="text-4xl font-cinzel font-bold mb-4 leading-tight">
                {activeTab === "onstage"
                  ? "The Spotlight Awaits"
                  : "Creativity Beyond Boundaries"}
              </h3>
              <p className="text-gray-300 leading-relaxed text-lg font-light">
                {activeTab === "onstage"
                  ? "Step into the limelight and let your talent shine. From dance to drama, the stage is yours to conquer."
                  : "Art, literature, and intellect converge. Express yourself through strokes, words, and ideas."}
              </p>
            </div>
          </div>

          {/* Right: Event List (Span 7) */}
          <div className="lg:col-span-7 bg-white/[0.02] rounded-sm border border-white/5 p-8 md:p-12 relative overflow-hidden h-[600px]">
            {/* Decorative Number */}
            <div className="absolute -top-10 -right-10 text-[200px] font-black text-white/[0.02] pointer-events-none select-none font-cinzel">
              {activeTab === "onstage" ? "01" : "02"}
            </div>

            <div className="h-full overflow-y-auto custom-scrollbar pr-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                {(activeTab === "onstage" ? onstageEvents : offstageEvents).map(
                  (event, i) => (
                    <div
                      key={`${activeTab}-${i}`}
                      className="event-item group flex items-center gap-4 p-4 border-b border-white/5 hover:border-[#BA170D]/30 hover:bg-white/[0.02] transition-all cursor-default"
                    >
                      <span className="text-[#BA170D] font-mono text-xs opacity-50 group-hover:opacity-100">
                        / {(i + 1).toString().padStart(2, "0")}
                      </span>
                      <span className="text-lg font-light text-gray-400 group-hover:text-white transition-colors">
                        {event}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
