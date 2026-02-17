"use client";

import { motion, useScroll, useTransform, useMotionTemplate, useMotionValue } from "framer-motion";
import Image from "next/image";
import { useRef, useEffect, MouseEvent, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";

gsap.registerPlugin(ScrollTrigger);

export default function Hero({ startAnimation = true }: { startAnimation?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);

  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  
  // Mouse move effect for spotlight
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  useEffect(() => {
    if (!startAnimation) return;
    
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      
      gsap.set(textRef.current, { y: 100, opacity: 0, scale: 0.9 });
      
      tl.to(textRef.current, {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 1.5,
        ease: "power3.out"
      });
      
    }, containerRef);

    return () => ctx.revert();
  }, [startAnimation]);

  return (
    <div 
      ref={containerRef} 
      onMouseMove={handleMouseMove}
      className="relative h-dvh w-full flex items-center justify-center overflow-hidden bg-[#050505] selection:bg-[#FFD700] selection:text-black"
    >
      
      {/* Interactive Spotlight (User Controlled) */}
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-50 z-10"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              800px circle at ${mouseX}px ${mouseY}px,
              rgba(255, 215, 0, 0.05),
              transparent 80%
            )
          `,
        }}
      />

      {/* Automated Stage Lights (Ambient) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         {/* Left Blue Light */}
         <motion.div 
            animate={{ 
                opacity: [0.3, 0.6, 0.3],
                rotate: [-20, -10, -20]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[-20%] left-[-10%] w-[80vw] h-[150vh] bg-linear-to-br from-blue-900/20 via-transparent to-transparent blur-3xl md:blur-[100px] transform origin-top-left will-change-transform"
         />
         {/* Right Red Light */}
         <motion.div 
            animate={{ 
                opacity: [0.3, 0.6, 0.3],
                rotate: [20, 10, 20]
            }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute top-[-20%] right-[-10%] w-[80vw] h-[150vh] bg-linear-to-bl from-[#BA170D]/20 via-transparent to-transparent blur-3xl md:blur-[100px] transform origin-top-right will-change-transform"
         />
      </div>

      {/* Noise Texture - Reduced opacity for mobile performance */}
      <div className="absolute inset-0 z-0 opacity-10 md:opacity-20 pointer-events-none mix-blend-overlay"
           style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}>
      </div>

      {/* Content Container */}
      <div className="relative z-20 flex flex-col items-center justify-center text-center px-4 w-full h-full">
          
          {/* Animated Logo */}
          <motion.div
            initial={{ opacity: 0, y: -50, rotateX: 20 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="relative w-32 h-32 md:w-40 md:h-40 mb-6 md:mb-8 perspective-1000"
          >
             <motion.div
                animate={{ 
                    y: [-10, 10], 
                    rotate: [-5, 5],
                    filter: ["brightness(1)", "brightness(1.2)", "brightness(1)"] 
                }}
                transition={{ 
                    repeat: Infinity, 
                    repeatType: "reverse", 
                    duration: 4, 
                    ease: "easeInOut" 
                }}
                className="relative w-full h-full will-change-transform"
             >
                {/* Glow behind logo */}
                <div className="absolute inset-0 bg-[#FFD700] rounded-full blur-2xl opacity-20 hover:opacity-40 transition-opacity duration-500"></div>
                
                <Image 
                    src="/logo.png" 
                    alt="Jhalak Logo" 
                    fill
                    className="object-contain drop-shadow-[0_0_20px_rgba(255,215,0,0.3)]"
                    priority
                    sizes="(max-width: 768px) 96px, 128px"
                />
             </motion.div>
          </motion.div>

          <div className="relative isolate mb-8 w-full max-w-full overflow-hidden">
            {/* Background Stroke Text (Parallax) */}
            <motion.h1 
                style={{ y: y1 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[18vw] md:text-[15vw] font-black font-unbounded tracking-tighter leading-none text-transparent stroke-text opacity-10 blur-sm pointer-events-none select-none whitespace-nowrap will-change-transform"
            >
                JHALAK
            </motion.h1>
            
            {/* Main Foreground Text */}
            <h1 ref={textRef} className="relative text-[15vw] md:text-[12vw] font-black font-unbounded tracking-tighter leading-none text-white mix-blend-normal drop-shadow-[0_0_30px_rgba(255,215,0,0.2)] md:drop-shadow-[0_0_50px_rgba(255,215,0,0.3)]">
                JHALAK
                <span className="text-[#BA170D] text-[15vw] md:text-[12vw] leading-none">.</span>
            </h1>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="flex flex-col items-center gap-6 w-full px-4"
          >
            <p className="text-lg md:text-2xl text-gray-400 font-light tracking-[0.2em] uppercase max-w-2xl text-center leading-relaxed">
              The Stage Is Set <span className="text-[#FFD700] px-2 inline-block">•</span> <span className="nowrap">The Rhythm Awaits</span>
            </p>

            <div className="h-px w-24 bg-linear-to-r from-transparent via-white/30 to-transparent my-4"></div>

            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mt-2">
                <Link href="#events"
                 className="group relative px-8 py-3 bg-transparent overflow-hidden rounded-full border border-white/20 hover:border-[#FFD700]/50 transition-colors duration-300 active:scale-95 touch-manipulation min-w-[200px] flex items-center justify-center">
                    <div className="absolute inset-0 w-0 bg-[#FFD700] transition-all duration-250 ease-out group-hover:w-full opacity-10"></div>
                    <span className="relative text-white font-medium tracking-wider group-hover:text-[#FFD700] transition-colors">Explore The Lineup</span>
                </Link>

                <Link href="/register"
                 className="relative px-8 py-3 bg-[#FFD700] rounded-full text-black font-bold tracking-wider hover:bg-[#FFC000] hover:shadow-[0_0_20px_rgba(255,215,0,0.4)] transition-all duration-300 active:scale-95 touch-manipulation min-w-[200px] flex items-center justify-center transform hover:-translate-y-1">
                    Register Now
                </Link>
            </div>
          </motion.div>
      </div>
      
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <FloatingParticles />
      </div>

       {/* Scroll Indicator */}
       <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5, duration: 1 }}
        className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20"
       >
         <div className="w-px h-12 md:h-16 bg-linear-to-b from-zinc-800 to-transparent relative overflow-hidden">
             <motion.div 
                animate={{ y: [-16, 16] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className="absolute top-0 w-full h-1/2 bg-[#FFD700]" 
             />
         </div>
       </motion.div>
       
       <style jsx global>{`
        .stroke-text {
            -webkit-text-stroke: 1px rgba(255, 255, 255, 0.1);
            color: transparent;
        }
       `}</style>
    </div>
  );
}

function FloatingParticles() {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsMobile(window.innerWidth < 768);
    
    // Simple resize handler to update mobile state
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!mounted) return null;

  // Reduce particles on mobile for performance
  const particleCount = isMobile ? 6 : 15;

  return (
    <>
      {[...Array(particleCount)].map((_, i) => (
        <motion.div 
            key={i}
            animate={{ 
                y: [0, -100, 0],
                opacity: [0, 0.8, 0],
                scale: [0, 1, 0]
            }}
            transition={{ 
                repeat: Infinity, 
                duration: 5 + Math.random() * 5, 
                ease: "easeInOut",
                delay: Math.random() * 5 
            }}
            className="absolute rounded-full blur-[1px]"
            style={{
                width: 2 + Math.random() * 3,
                height: 2 + Math.random() * 3,
                backgroundColor: Math.random() > 0.5 ? '#FFD700' : '#FFFFFF',
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                willChange: "transform, opacity"
            }}
        />
      ))}
    </>
  );
}
