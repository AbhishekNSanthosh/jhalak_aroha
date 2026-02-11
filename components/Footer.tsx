"use client";

import { useRef, useLayoutEffect } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function Footer() {
  const footerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Fade in main container
      gsap.from(containerRef.current, {
        scrollTrigger: {
          trigger: footerRef.current,
          start: "top 80%",
        },
        y: 100,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
      });

      // Stagger links
      gsap.from(".footer-link-group", {
        scrollTrigger: {
          trigger: footerRef.current,
          start: "top 70%",
        },
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power2.out",
      });

      // Big Title Reveal
      gsap.from(titleRef.current, {
        scrollTrigger: {
          trigger: footerRef.current,
          start: "top 70%",
        },
        yPercent: 50,
        opacity: 0,
        duration: 1.5,
        ease: "expo.out",
      });
    }, footerRef);
    return () => ctx.revert();
  }, []);

  return (
    <footer
      ref={footerRef}
      className="relative bg-[#0A0A0A] text-white pt-32 pb-12 px-6 overflow-hidden border-t border-white/5 selection:bg-[#BA170D] selection:text-white"
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60vw] h-[400px] bg-[#BA170D]/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-blue-900/5 rounded-full blur-[150px] mix-blend-screen"></div>
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.04]"></div>
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)] pointer-events-none opacity-30"></div>

      <div ref={containerRef} className="container mx-auto relative z-10">
        {/* Top Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-16 mb-24">
          {/* Brand / CTA */}
          <div className="max-w-xl space-y-8">
            <h3 className="text-4xl md:text-6xl font-light leading-tight tracking-tight">
              Ready to{" "}
              <span className="text-[#BA170D] font-cinzel font-bold">
                ignite
              </span>{" "}
              <br />
              the stage?
            </h3>
            <Link
              href="https://www.graburpass.com/e/S6wHPW"
              target="_blank"
              className="inline-flex items-center gap-4 group"
            >
              <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-[#BA170D] group-hover:border-[#BA170D] transition-all duration-300 bg-white/5 backdrop-blur-sm shadow-lg group-hover:shadow-[#BA170D]/20">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="transform group-hover:-rotate-45 transition-transform duration-300"
                >
                  <path
                    d="M5 12H19"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 5L19 12L12 19"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="text-xl tracking-widest uppercase font-light group-hover:text-[#BA170D] transition-all duration-300">
                Register Now
              </span>
            </Link>
          </div>

          {/* Links Columns */}
          <div className="flex-1 w-full lg:w-auto flex flex-wrap justify-start lg:justify-end gap-16 lg:gap-32">
            {/* Explore */}
            <div className="footer-link-group flex flex-col space-y-6">
              <h4 className="text-gray-500 uppercase tracking-widest text-xs font-bold mb-2">
                Explore
              </h4>
              <div className="flex flex-col space-y-4">
                {["Home", "Events", "Schedule", "Sponsors"].map((item) => (
                  <Link
                    key={item}
                    href="#"
                    className="text-gray-300 hover:text-white transition-colors w-fit text-sm tracking-wide hover:translate-x-1 duration-300 inline-block"
                  >
                    {item}
                  </Link>
                ))}
              </div>
            </div>

            {/* Socials */}
            <div className="footer-link-group flex flex-col space-y-6">
              <h4 className="text-gray-500 uppercase tracking-widest text-xs font-bold mb-2">
                Follow Us
              </h4>
              <div className="flex flex-row gap-4">
                <Link
                  href="https://www.instagram.com/jhalakccet?igsh=eHE0OGxwMnl0aDI4"
                  target="_blank"
                  className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-gray-300 hover:text-[#BA170D] hover:border-[#BA170D] transition-all duration-300 hover:scale-110"
                  title="Instagram"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect
                      x="2"
                      y="2"
                      width="20"
                      height="20"
                      rx="5"
                      ry="5"
                    ></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </Link>
                <Link
                  href="#"
                  className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-gray-300 hover:text-[#BA170D] hover:border-[#BA170D] transition-all duration-300 hover:scale-110"
                  title="YouTube"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
                    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
                  </svg>
                </Link>
                <Link
                  href="https://www.carmelcet.in"
                  target="_blank"
                  className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-gray-300 hover:text-[#BA170D] hover:border-[#BA170D] transition-all duration-300 hover:scale-110"
                  title="College Website"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                  </svg>
                </Link>
              </div>
            </div>

            {/* Contact - Added for balance */}
            <div className="footer-link-group flex flex-col space-y-6">
              <h4 className="text-gray-500 uppercase tracking-widest text-xs font-bold mb-2">
                Contact
              </h4>
              <div className="flex flex-col space-y-4">
                <a
                  href="mailto:jhalak@carmelcet.in"
                  className="text-gray-300 hover:text-[#BA170D] transition-colors text-sm flex items-center gap-2"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  jhalak@carmelcet.in
                </a>
                <div className="text-gray-300 text-sm flex flex-col gap-1">
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                    Steeve
                  </span>
                  <a
                    href="tel:+916235834190"
                    className="hover:text-[#BA170D] transition-colors flex items-center gap-2"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.12 2h3a2 2 0 0 1 2 1.72 12.05 12.05 0 0 0 .75 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.03 12.03 0 0 0 2.81.74A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    +91 62358 34190
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent mb-12"></div>

        {/* Bottom Section: Massive Text */}
        <div className="relative overflow-hidden mb-8 group">
          <h1
            ref={titleRef}
            className="text-[12vw] md:text-[14vw] font-cinzel font-black leading-none text-center tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-[#333] to-transparent select-none pointer-events-none opacity-50 group-hover:opacity-70 transition-opacity duration-700"
          >
            JHALAK '26
          </h1>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-6 text-xs md:text-sm text-gray-500 uppercase tracking-widest font-mono">
          <span className="order-2 md:order-1">© 2026 Jhalak CCET</span>

          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="order-1 md:order-2 hover:text-[#BA170D] transition-colors cursor-pointer flex items-center gap-2 group/btn"
          >
            Back to Top
            <div className="p-1 rounded-full border border-white/10 group-hover/btn:border-[#BA170D] transition-colors">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="group-hover/btn:-translate-y-0.5 transition-transform"
              >
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </div>
          </button>

          <span className="order-3">
            Made with <span className="text-[#BA170D] animate-pulse">♥</span> by
            404
          </span>
        </div>
      </div>
    </footer>
  );
}
