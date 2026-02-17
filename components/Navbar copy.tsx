"use client";

import { motion, LayoutGroup, AnimatePresence } from "framer-motion";
import { auth, googleProvider, db } from "@/lib/firebase";
import { signOut, onAuthStateChanged, User } from "firebase/auth";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { LogOut, User as UserIcon } from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      // Check profile completeness
      if (currentUser && db) {
        try {
            const userDocRef = doc(db, "users", currentUser.uid);
            const userDoc = await getDoc(userDocRef);
            
            if (!userDoc.exists()) {
                router.push("/profile");
            } else {
                const data = userDoc.data();
                if (!data.department || !data.semester) {
                    router.push("/profile");
                }
            }
        } catch (error: any) {
            // Ignore offline errors as they might be due to adblockers or network init
            if (error?.code !== 'unavailable' && error?.message?.indexOf('offline') === -1) {
                console.error("Error checking profile:", error);
            }
        }
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogin = () => {
    router.push(`/login?callbackUrl=${pathname}`);
  };

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <LayoutGroup>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
        className="fixed top-6 right-6 z-50 flex justify-end items-center gap-4"
      >
        <AnimatePresence mode="wait">
          {user ? (
            <motion.div 
              key="user-profile"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-4"
            >
              {/* Profile Pill */}
              <button 
                onClick={() => router.push("/profile")}
                className="flex items-center bg-black/40 backdrop-blur-xl border border-white/10 rounded-full p-1.5 md:pl-6 md:pr-2 md:py-2 shadow-2xl hover:border-[#FFD700]/50 transition-colors group"
              >
                <div className="hidden md:flex flex-col items-start mr-2">
                    <span className="text-white text-sm font-medium group-hover:text-[#FFD700] transition-colors">
                        {user.displayName?.split(" ")[0]}
                    </span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">Profile</span>
                </div>
                
                <div className="relative w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden border-2 border-[#FFD700]/50 group-hover:border-[#FFD700] transition-colors">
                  {user.photoURL ? (
                    <Image 
                      src={user.photoURL} 
                      alt="User" 
                      fill 
                      // style={{ height: 'auto' }}
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#FFD700] text-black flex items-center justify-center">
                      <UserIcon size={20} />
                    </div>
                  )}
                </div>
              </button>

              {/* Logout Button */}
              <button 
                onClick={handleLogout}
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-500 transition-all active:scale-95"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </motion.div>
          ) : (
            <motion.button 
              key="login-btn"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={handleLogin}
              className="relative group overflow-hidden rounded-full bg-white text-black px-6 py-2 transition-all duration-300 hover:bg-[#FFD700] hover:shadow-[0_0_25px_rgba(255,215,0,0.4)] active:scale-95"
            >
              <div className="relative flex items-center gap-2">
                <span className="text-xs md:text-sm font-black font-unbounded tracking-wider uppercase">
                  Login
                </span>
                <div className="w-1.5 h-1.5 rounded-full bg-black shadow-[0_0_8px_rgba(0,0,0,0.5)] group-hover:scale-125 transition-transform duration-300"></div>
              </div>
            </motion.button>
          )}
        </AnimatePresence>
      </motion.nav>
    </LayoutGroup>
  );
}
