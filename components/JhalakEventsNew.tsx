"use client";

import { useRef, useLayoutEffect, useState, useMemo } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  jhalakEvents,
  EventRule,
  EventCategory,
} from "@/data/jhalakEventsData";
import Link from "next/link";

gsap.registerPlugin(ScrollTrigger);

export default function JhalakEventsNew() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<EventCategory>("onstage");
  const [selectedEvent, setSelectedEvent] = useState<EventRule | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEvents = useMemo(() => {
    return jhalakEvents.filter((event) => {
      const matchesCategory = event.category === activeTab;
      const matchesSearch =
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (event.description &&
          event.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase())) ||
        (event.tags &&
          event.tags.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase()),
          ));
      return matchesCategory && matchesSearch;
    });
  }, [activeTab, searchQuery]);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".events-header-new", {
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
        },
        y: 50,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
      });

      gsap.fromTo(
        ".event-card",
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.08,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".events-grid",
            start: "top 85%",
          },
        },
      );
    }, containerRef);
    return () => ctx.revert();
  }, [activeTab, searchQuery]);

  return (
    <section
      ref={containerRef}
      className="relative bg-[#0A0A0A] text-white py-24 px-6 md:px-12 min-h-screen border-t border-white/5 overflow-hidden selection:bg-[#BA170D] selection:text-white"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(30,30,30,1)_0%,rgba(10,10,10,1)_100%)] opacity-80"></div>
        <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] bg-[#BA170D]/5 rounded-full blur-[120px] mix-blend-screen"></div>
        <div className="absolute bottom-[10%] left-[-10%] w-[30vw] h-[30vw] bg-blue-900/5 rounded-full blur-[100px] mix-blend-screen"></div>
      </div>

      <div className="container mx-auto relative z-10 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12 events-header-new">
          <h2 className="text-[#BA170D] font-cinzel font-bold text-sm uppercase tracking-[0.3em] mb-3">
            {activeTab === "onstage"
              ? "ON-STAGE EVENTS"
              : activeTab === "offstage"
                ? "OFF-STAGE EVENTS"
                : "ONLINE EVENTS"}
          </h2>
          <h3 className="text-4xl md:text-6xl font-light tracking-tight mb-8">
            JHALAK{" "}
            <span className="font-serif italic text-white/50">Events</span>
          </h3>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto mb-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-full text-white placeholder-gray-500 focus:outline-none focus:border-[#BA170D]/50 focus:bg-white/10 transition-all"
              />
              <svg
                className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex flex-wrap justify-center gap-3">
            {(["onstage", "offstage", "online"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setSearchQuery("");
                }}
                className={`px-6 py-2 rounded-full text-xs uppercase tracking-wider font-bold transition-all duration-300 ${
                  activeTab === tab
                    ? "bg-[#BA170D] text-white shadow-[0_0_20px_rgba(186,23,13,0.4)]"
                    : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10"
                }`}
              >
                {tab === "online"
                  ? "Online"
                  : tab === "onstage"
                    ? "On-Stage"
                    : "Off-Stage"}
              </button>
            ))}
          </div>
        </div>

        {/* Events Grid */}
        <div className="events-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredEvents.map((event, index) => (
            <div
              key={index}
              onClick={() => setSelectedEvent(event)}
              className="event-card group relative bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/10 rounded-2xl p-6 hover:border-[#BA170D]/50 transition-all duration-300 cursor-pointer overflow-hidden"
            >
              {/* Hover Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#BA170D]/0 to-[#BA170D]/0 group-hover:from-[#BA170D]/10 group-hover:to-transparent transition-all duration-500 rounded-2xl"></div>

              {/* Content */}
              <div className="relative z-10">
                {/* Tags */}
                {event.tags && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {event.tags.slice(0, 3).map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-[10px] font-bold uppercase tracking-wider rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Title */}
                <h4 className="text-xl font-cinzel font-bold text-white mb-3 group-hover:text-[#BA170D] transition-colors">
                  {event.title}
                </h4>

                {/* Description */}
                {event.description && (
                  <p className="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-2">
                    {event.description}
                  </p>
                )}

                {/* Arrow Icon */}
                <div className="flex items-center justify-end">
                  <div className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-[#BA170D] flex items-center justify-center transition-all duration-300 group-hover:translate-x-1">
                    <svg
                      className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredEvents.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">
              No events found matching your search.
            </p>
          </div>
        )}

        {/* Register Button */}
        <div className="flex justify-center">
          <Link
            href="/register"
            className="group relative px-12 py-4 bg-[#BA170D] hover:bg-[#900000] text-white font-cinzel font-bold tracking-widest uppercase transition-all duration-300 shadow-[0_0_30px_rgba(186,23,13,0.4)] hover:shadow-[0_0_50px_rgba(186,23,13,0.6)] overflow-hidden rounded-lg"
          >
            <span className="relative z-10 flex items-center gap-3">
              Register for Jhalak
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                className="group-hover:translate-x-1 transition-transform"
              >
                <path
                  d="M5 12H19M12 5L19 12L12 19"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
          </Link>
        </div>
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="bg-[#111] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 bg-gradient-to-r from-[#BA170D]/20 to-transparent">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedEvent.tags?.map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-[10px] font-bold uppercase tracking-wider rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-2xl md:text-3xl font-cinzel font-bold text-white mb-2">
                    {selectedEvent.title}
                  </h3>
                  {selectedEvent.description && (
                    <p className="text-gray-400 text-sm">
                      {selectedEvent.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="ml-4 text-white/50 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-[#BA170D] rounded-full"></span>
                Rules & Regulations
              </h4>
              <ul className="space-y-3">
                {selectedEvent.rules.map((rule, index) => (
                  <li
                    key={index}
                    className="flex gap-3 text-gray-300 font-light leading-relaxed text-sm"
                  >
                    <span className="text-[#BA170D] mt-1.5 text-xs">●</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-white/10 bg-[#0A0A0A]">
              <p className="text-white/30 text-xs text-center font-mono mb-3">
                * Judges' decision will be final and binding.
              </p>
              <Link href="/register" className="block w-full text-center py-3 bg-[#BA170D] hover:bg-[#900000] text-white font-bold rounded-lg transition-all">
                Register for this Event
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
