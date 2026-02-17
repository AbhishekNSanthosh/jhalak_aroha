"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect } from "react";

export default function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const exitTimer = setTimeout(() => {
        onComplete();
    }, 2500); // Reduced time for snappier feel

    return () => {
        clearTimeout(exitTimer);
    };
  }, [onComplete]);

  return (
    <motion.div
        className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-black"
        exit={{ opacity: 0 }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
    >
        {/* College Name */}
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center mb-8 relative z-10"
        >
            <p className="text-gray-400 text-sm md:text-base font-medium tracking-wider uppercase mb-2">
                Carmel College of Engineering & Technology
            </p>
            <p className="text-[#BA170D] text-xs md:text-sm font-mono tracking-[0.3em] uppercase">
                Presents
            </p>
        </motion.div>

        <div className="relative w-48 h-48 md:w-64 md:h-64">
            {/* Pulsing Glow */}
            <motion.div 
                animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ 
                    repeat: Infinity, 
                    duration: 2,
                    ease: "easeInOut" 
                }}
                className="absolute inset-0 bg-[#BA170D] rounded-full blur-[80px] opacity-20"
            />
            
            <Image 
                src="/logo.png" 
                alt="Jhalak Logo"
                fill
                sizes="(max-width: 768px) 192px, 256px"
                className="object-contain drop-shadow-[0_0_20px_rgba(186,23,13,0.2)]"
                priority
            />
        </div>

        <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-6 text-4xl md:text-6xl font-black font-unbounded text-white tracking-tighter"
        >
            JHALAK
        </motion.h1>

    </motion.div>
  );
}
