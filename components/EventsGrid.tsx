"use client";

import { motion, useScroll, useTransform, useMotionTemplate, useMotionValue } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn, slugify } from "@/lib/utils";
import { categories } from "@/data/constant";

export default function EventsGrid() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const heroParallax = useTransform(scrollYProgress, [0, 0.5], [0, 100]);

  return (
    <div id="events" ref={containerRef} className="relative py-24 px-6 md:px-12 bg-[#0A0A0A] overflow-hidden">
        
       {/* Background Grid */}
       <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]pointer-events-none"></div>

       <div className="max-w-7xl mx-auto relative z-10">
         <motion.div 
           initial={{ opacity: 0, y: 50 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ duration: 0.8 }}
           className="text-center mb-20"
         >
           <h2 className="text-4xl md:text-7xl font-bold font-unbounded mb-6 text-white tracking-tighter">
             THE EVENT LINEUP
           </h2>
           <p className="text-gray-400 max-w-2xl mx-auto text-lg">
             Witness the best talent compete for glory across music, dance, and arts.
           </p>
         </motion.div>

         {/* --- Featured Event: AROHA (Moved from Grid by User Request) --- */}
         <div className="mb-32 relative">
              <div className="flex items-center gap-4 mb-8 justify-center">
                 <span className="h-px w-12 bg-[#BA170D]"></span>
                 <h3 className="text-xl font-mono text-[#BA170D] uppercase tracking-[0.3em]">
                   Flagship Event
                 </h3>
                 <span className="h-px w-12 bg-[#BA170D]"></span>
              </div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
                className="relative rounded-4xl overflow-hidden border border-white/10 bg-[#0F0F0F] min-h-[500px] md:h-[600px] shadow-[0_0_50px_rgba(186,23,13,0.1)] group flex flex-col justify-end md:block"
              >
                 
                 {/* Background Glow */}
                 <div className="absolute top-0 right-0 w-full h-full bg-linear-to-bl from-[#BA170D]/20 via-transparent to-transparent opacity-50"></div>
                 <div className="absolute bottom-0 left-0 w-full h-1/2 bg-linear-to-t from-black to-transparent z-10"></div>
 
                 {/* Parallax Image - Positioned Absolute */}
                 <div className="absolute inset-0 md:left-[30%] overflow-hidden">
                     <motion.div 
                         style={{ y: heroParallax }}
                         className="absolute inset-0 -top-[20%] -bottom-[20%]"
                     >
                          {/* Backlight for Dancer */}
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#BA170D]/10 rounded-full blur-[100px]"></div>
 
                          <Image 
                             src="/dance.png"
                             alt="Aroha Dancer"
                             fill
                             className="object-contain md:object-cover object-center opacity-90 group-hover:scale-105 transition-transform duration-1000 ease-out"
                         />
                     </motion.div>
                     
                     {/* Horizontal Gradient Mask (Left to Right) for blending text */}
                     <div className="absolute inset-0 bg-linear-to-r from-[#0F0F0F] via-[#0F0F0F]/80 to-transparent z-10 hidden md:block"></div>
                     {/* Vertical Gradient Mask (Bottom to Top) for mobile */}
                     <div className="absolute inset-0 bg-linear-to-t from-[#0F0F0F] via-[#0F0F0F]/50 to-transparent z-10 md:hidden"></div>
                 </div>
 
                 {/* Text Content */}
                 <div className="relative z-20 p-8 md:p-16 w-full md:w-1/2 h-full flex flex-col justify-end md:justify-center">
                      <div className="mb-4">
                         <span className="px-4 py-2 border border-[#BA170D] bg-[#BA170D]/10 text-[#BA170D] rounded-full uppercase text-xs font-bold tracking-wider mb-4 inline-block">
                             Main Stage Event
                         </span>
                      </div>
                      <h2 className="text-6xl md:text-8xl lg:text-9xl font-black font-unbounded text-white mb-6 uppercase tracking-tighter drop-shadow-2xl leading-none">
                         AROHA
                      </h2>
                     <p className="text-gray-300 text-lg md:text-xl leading-relaxed mb-8 drop-shadow-md">
                        The heartbeat of Jhalak. A fusion of rhythm, grace, and energy where the best dancers collide.
                     </p>
                     
                     <div className="flex flex-wrap gap-3">
                        {["Group Dance", "Fusion", "Battle"].map((tag) => (
                            <span key={tag} className="px-4 py-2 bg-white/5 border border-white/10 text-gray-300 rounded-full text-xs font-bold tracking-wider hover:bg-white/10 transition-colors cursor-default">
                                {tag}
                            </span>
                        ))}
                     </div>
                </div>
             </motion.div>
        </div>

        {/* --- Competitions Grid --- */}
        {categories.filter(c => c.title !== "Flagship Event").map((category, catIndex) => (
          <div key={catIndex} className="mb-24 last:mb-0">
             <div className="flex items-center gap-4 mb-10">
                <span className="h-px flex-1 bg-linear-to-r from-transparent to-[#BA170D]/50"></span>
                <h3 className="text-xl md:text-2xl font-mono text-[#BA170D] uppercase trackingwidest">
                  {category.title}
                </h3>
                <span className="h-px flex-1 bg-linear-to-l from-transparent to-[#BA170D]/50"></span>
             </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[300px]">
              {category.items.map((item: any, index: number) => (
                <EventCard key={index} item={item} index={index} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EventCard({ item, index }: { item: any, index: number }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const { left, top } = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - left);
    y.set(e.clientY - top);
  }

  const cardContent = (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      onMouseMove={handleMouseMove}
      className={cn(
        "group relative rounded-3xl overflow-hidden border border-white/5 bg-white/5 hover:border-[#BA170D]/20 transition-colors duration-500 h-full",
        item.cols || "col-span-1"
      )}
    >
        {/* Spotlight */}
        <motion.div
            className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
            style={{
            background: useMotionTemplate`
                radial-gradient(
                600px circle at ${x}px ${y}px,
                rgba(186, 23, 13, 0.06),
                transparent 40%
                )
            `,
            }}
        />

        {/* Gradient Background */}
        <div className={`absolute inset-0 bg-linear-to-br ${item.gradient} opacity-20 group-hover:opacity-40 transition-opacity duration-500`} />
        
        {/* Content */}
        <div className="absolute inset-0 p-8 flex flex-col justify-end z-10">
            <div className="transform transition-transform duration-300 group-hover:-translate-y-2">
                <div className="flex gap-2 mb-4 flex-wrap">
                    {item.tags.map((tag: string, i: number) => (
                        <span key={i} className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[#BA170D] border border-[#BA170D]/20">
                            {tag}
                        </span>
                    ))}
                </div>
                
                <h3 className={cn(
                    "font-bold text-white mb-2 leading-none",
                    item.cols ? "text-5xl md:text-7xl" : "text-2xl md:text-3xl"
                )}>
                    {item.title}
                </h3>
                
                {item.description && (
                    <p className="text-gray-300 text-sm md:text-lg max-w-md mt-4 line-clamp-3">
                        {item.description}
                    </p>
                )}
            </div>

            {/* Read More Icon */}
            <div className="absolute top-6 right-6 w-10 h-10 rounded-full border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:rotate-45">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 11L11 1M11 1H2M11 1V10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </div>
        </div>

        {/* Decorative Number */}
        <div className="absolute -top-10 -right-4 text-[120px] font-black text-white/2 select-none pointer-events-none group-hover:text-white/4 transition-colors duration-500 font-mono">
            {String(index + 1).padStart(2, '0')}
        </div>
    </motion.div>
  );

  return (
    <Link href={`/events/${slugify(item.title)}`} className={cn("block h-full store-card-link", item.cols)}>
        {cardContent}
    </Link>
  );
}
