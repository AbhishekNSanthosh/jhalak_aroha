"use client";

import { useState, useEffect, Suspense } from "react";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";

const GoogleIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
);

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const callbackUrl = searchParams.get("callbackUrl") || "/profile";

  useEffect(() => {
    if (!auth) return;

    // Standard Auth Listener is the most reliable way to handle state
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth State:", user ? "AUTHENTICATED" : "GUEST");
      if (user) {
        // Use router.push for a smoother internal transition
        router.push(callbackUrl);
      } else {
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth, callbackUrl, router]);

  const handleLogin = async () => {
    if (!auth || !googleProvider) return;
    setLoading(true);
    setError(null);
    try {
      console.log("Initiating Google Popup...");
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged will catch the user and redirect automatically
    } catch (err: any) {
      console.error("Popup Login Error:", err);
      // Gracefully handle "popup closed" by the user
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || "Failed to sign in. Please try again.");
      }
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
            <div className="animate-spin w-8 h-8 border-2 border-[#BA170D] border-t-transparent rounded-full"></div>
            <p className="text-white/40 font-black font-unbounded text-[10px] tracking-widest uppercase animate-pulse">Checking Session</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-outfit relative overflow-hidden flex items-center justify-center p-4">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[80vw] h-[80vw] bg-blue-900/10 blur-[120px] rounded-full opacity-40"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[80vw] h-[80vw] bg-[#BA170D]/10 blur-[120px] rounded-full opacity-40"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md bg-white/5 backdrop-blur-3xl border border-white/10 p-10 md:p-14 rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] text-center group"
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="mb-10 flex justify-center">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="relative w-32 h-32 flex items-center justify-center"
            >
               <Image 
                src="/logo.png" 
                alt="Logo" 
                width={128} 
                height={128} 
                priority
                unoptimized
                style={{ width: '100%', height: 'auto' }}
                className="object-contain" 
               />
            </motion.div>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-black font-unbounded text-white mb-4 tracking-tighter uppercase leading-none">
            WELCOME<br/>BACK
          </h1>
          <p className="text-gray-400 mb-12 text-sm md:text-base tracking-wide font-medium font-outfit">
            Sign in to access your dashboard and manage event registrations.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold uppercase tracking-wider">
                {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full relative group overflow-hidden rounded-2xl bg-white text-black py-4.5 transition-all duration-500 hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] active:scale-[0.98] disabled:opacity-70"
          >
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="relative flex items-center justify-center gap-3">
              {loading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <GoogleIcon />
                  <span className="text-sm font-black font-unbounded uppercase tracking-tighter hidden md:inline-block">
                    Continue with Google
                  </span>
                </>
              )}
            </div>
          </button>

          <p className="mt-10 text-[10px] text-gray-500 uppercase tracking-widest font-bold opacity-60">
            Secure authentication via Google Firebase
          </p>
        </motion.div>
      </motion.div>

      {/* Decorative text */}
      <div className="absolute bottom-10 left-10 pointer-events-none opacity-[0.03] select-none hidden md:block">
        <h2 className="text-[15rem] font-black font-unbounded leading-none">JHALAK</h2>
      </div>
      <div className="absolute top-10 right-10 pointer-events-none opacity-[0.03] select-none hidden md:block">
        <h2 className="text-[15rem] font-black font-unbounded uppercase leading-none">2026</h2>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-white">
        <div className="animate-spin w-8 h-8 border-2 border-[#BA170D] border-t-transparent rounded-full"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
