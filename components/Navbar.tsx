"use client";

import { useRef, useLayoutEffect, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { User as UserIcon } from "lucide-react";

export default function Navbar() {
  const navRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(navRef.current, {
        y: -100,
        opacity: 0,
        duration: 1.2,
        ease: "power4.out",
        delay: 0.2,
      });
    }, navRef);

    return () => ctx.revert();
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    if (!auth) return;
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);


  return (
    <nav
      ref={navRef}
      className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4"
    >
      <div className="relative group">
        {/* Animated Gradient Border */}
        <div className="absolute -inset-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"></div>

        <div className="relative bg-[#0A0A0A]/60 backdrop-blur-md border border-white/10 rounded-full pl-8 pr-4 py-2 flex items-center shadow-2xl transition-all duration-300 hover:border-white/20 hover:bg-[#0A0A0A]/80 gap-6">
          {/* Logo */}
          <Link
            href="/"
            className="text-xl font-cinzel font-bold tracking-tighter shrink-0 hover:scale-105 transition-transform duration-300 flex items-center gap-1 group/logo"
          >
            <span className="text-white group-hover/logo:text-gray-200 transition-colors">
              JHALAK
            </span>
            <span className="text-[#BA170D] group-hover/logo:drop-shadow-[0_0_8px_rgba(186,23,13,0.8)]">
              .
            </span>
          </Link>

          {/* Divider */}
          <div className="w-[1px] h-6 bg-white/10 hidden md:block"></div>

          {/* Auth Links */}
          <div className="flex items-center min-w-[80px] justify-center">
             {!loading && (
                user ? (
                   <Link
                    href="/profile"
                    className="flex items-center gap-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-full pl-4 pr-1 py-1 hover:border-[#BA170D]/50 hover:bg-white/10 hover:shadow-[0_0_30px_rgba(186,23,13,0.15)] transition-all duration-500 group/profile active:scale-95"
                   >
                     <div className="hidden md:flex flex-col items-start leading-none">
                        <span className="text-[7px] font-black text-[#BA170D] uppercase tracking-[0.3em] mb-1 opacity-70">Account</span>
                        <span className="text-[10px] font-black font-unbounded text-white group-hover:text-white transition-colors uppercase tracking-tighter">
                          {user.displayName?.split(" ")[0] || "Profile"}
                        </span>
                     </div>
                     <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-[#BA170D] transition-all duration-500 shadow-2xl group-hover:rotate-3 group-hover:scale-110">
                       {user.photoURL ? (
                         <Image 
                           src={user.photoURL} 
                           alt="User" 
                           fill 
                           className="object-cover"
                         />
                       ) : (
                         <div className="w-full h-full bg-[#BA170D]/10 flex items-center justify-center text-[#BA170D]">
                           <UserIcon size={16} />
                         </div>
                       )}
                     </div>
                   </Link>
                ) : (
                   <Link
                    href="/login"
                    className="relative group/login overflow-hidden rounded-full bg-white text-black px-5 py-2 transition-all duration-300 hover:bg-[#BA170D] hover:text-white hover:shadow-[0_0_20px_rgba(186,23,13,0.4)] active:scale-95 flex items-center gap-2"
                   >
                     <span className="text-[10px] font-black font-unbounded tracking-wider uppercase">
                       Login
                     </span>
                     <div className="w-1.5 h-1.5 rounded-full bg-black shadow-[0_0_5px_rgba(0,0,0,0.3)] group-hover/login:scale-125 transition-transform duration-300"></div>
                   </Link>
                )
             )}
          </div>
        </div>
      </div>
    </nav>
  );
}
