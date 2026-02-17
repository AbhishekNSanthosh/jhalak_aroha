"use client";

import { motion } from "framer-motion";

export default function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-outfit relative overflow-hidden">
        {/* Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            <div className="absolute top-[-20%] left-[-10%] w-[80vw] h-[80vw] bg-blue-900/10 blur-[100px] rounded-full"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[80vw] h-[80vw] bg-[#BA170D]/10 blur-[100px] rounded-full"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-24">
            <div className="max-w-7xl mx-auto flex flex-col gap-8">
                {/* Back Button Skeleton */}
                <div className="h-10 w-24 bg-white/5 rounded-full animate-pulse border border-white/10 self-start" />

                <div className="flex flex-col md:flex-row gap-8 items-start w-full">
                    {/* Profile Form Skeleton */}
                    <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-8 rounded-2xl w-full max-w-xl shadow-2xl flex-1">
                        <div className="flex flex-col items-center mb-10">
                            <div className="w-24 h-24 mb-4 rounded-full bg-white/5 animate-pulse border-2 border-[#BA170D]/20" />
                            <div className="h-8 w-48 bg-white/5 rounded-md animate-pulse mb-2" />
                            <div className="h-4 w-64 bg-white/5 rounded-md animate-pulse" />
                        </div>

                        <div className="space-y-6">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="space-y-3">
                                    <div className="h-3 w-20 bg-white/5 rounded animate-pulse" />
                                    <div className={`h-14 bg-white/5 rounded-xl animate-pulse ${i === 2 || i === 3 || i === 4 ? "grid grid-cols-4 gap-3 invisible" : "w-full"}`} />
                                    {i > 1 && (
                                        <div className={`grid ${i === 2 ? "grid-cols-2" : i === 3 ? "grid-cols-4" : "grid-cols-3"} gap-3 mt-3`}>
                                            {[...Array(i === 2 ? 4 : i === 3 ? 4 : 3)].map((_, j) => (
                                                <div key={j} className="h-12 bg-white/5 rounded-xl animate-pulse" />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div className="h-16 w-full bg-white/5 rounded-xl animate-pulse mt-8" />
                        </div>
                    </div>

                    {/* Registrations Section Skeleton */}
                    <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-8 rounded-2xl w-full max-w-xl shadow-2xl flex-1 flex flex-col h-full self-stretch">
                        <div className="h-8 w-48 bg-white/5 rounded-md animate-pulse mx-auto mb-8" />
                        
                        <div className="flex-1 space-y-8">
                            {[1, 2].map((i) => (
                                <div key={i} className="space-y-4">
                                    <div className="h-3 w-24 bg-white/5 rounded animate-pulse" />
                                    <div className="space-y-3">
                                        {[1, 2, 3].map((j) => (
                                            <div key={j} className="h-16 bg-white/5 border border-white/10 rounded-xl animate-pulse" />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-8 pt-6 border-t border-white/10">
                            <div className="h-14 w-full bg-white/5 rounded-xl animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}
