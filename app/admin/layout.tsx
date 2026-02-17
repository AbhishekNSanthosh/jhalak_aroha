"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();


  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!auth || !db) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login?callbackUrl=/admin");
        return;
      }

      try {
        const firestore = db!;
        const userDoc = await getDoc(doc(firestore, "users", user.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.role === 'admin' || userData.role === 'organizer') {
                setIsAdmin(true);
                setUserRole(userData.role);
                
                // Redirect Organizer if trying to access restricted pages
                if (userData.role === 'organizer' && (pathname === '/admin' || pathname.startsWith('/admin/users'))) {
                    router.replace('/admin/events');
                }
            } else {
                alert("Access Denied: You do not have admin privileges.");
                router.push("/");
            }
        } else {
            router.push("/profile");
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router, pathname]);

  if (loading) {
    return (
        <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-white">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-[#BA170D] border-t-transparent rounded-full animate-spin"></div>
                <p className="font-unbounded tracking-widest text-sm">VERIFYING ACCESS...</p>
            </div>
        </div>
    );
  }

  if (!isAdmin) return null;

  const NavLinks = () => (
      <>
        {userRole === 'admin' && (
            <button 
                onClick={() => router.push("/admin")}
                className={`w-full text-left px-4 py-3 rounded-xl border font-bold text-sm tracking-wide transition-colors ${
                    pathname === '/admin' 
                    ? "bg-[#BA170D]/10 text-[#BA170D] border-[#BA170D]/20" 
                    : "border-transparent text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
            >
                Overview
            </button>
        )}
        
        {userRole === 'admin' && (
            <button 
                onClick={() => router.push("/admin/users")}
                className={`w-full text-left px-4 py-3 rounded-xl border font-bold text-sm tracking-wide transition-colors ${
                    pathname.startsWith('/admin/users')
                    ? "bg-[#BA170D]/10 text-[#BA170D] border-[#BA170D]/20" 
                    : "border-transparent text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
            >
                User Management
            </button>
        )}

        <button 
            onClick={() => router.push("/admin/events")}
            className={`w-full text-left px-4 py-3 rounded-xl border font-bold text-sm tracking-wide transition-colors ${
                pathname.startsWith('/admin/events')
                ? "bg-[#BA170D]/10 text-[#BA170D] border-[#BA170D]/20" 
                : "border-transparent text-gray-400 hover:bg-white/5 hover:text-white"
            }`}
        >
            Event Stats
        </button>

        <div className="pt-4 mt-4 border-t border-white/10">
            <button 
                    onClick={() => router.push("/")}
                    className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white font-medium text-sm transition-colors"
            >
                Back to Home
            </button>
            <button
                onClick={() => auth?.signOut()}
                className="w-full text-left px-4 py-3 rounded-xl hover:bg-red-500/10 text-red-500/70 hover:text-red-500 font-medium text-sm transition-colors"
                >
                Sign Out
            </button>
        </div>
      </>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-outfit selection:bg-[#BA170D] selection:text-white">
        <div className="flex flex-col md:flex-row min-h-screen">
            {/* Sidebar (Desktop) */}
            <aside className="w-64 bg-black/40 border-r border-white/10 hidden md:block fixed h-screen overflow-y-auto">
                <div className="p-6 border-b border-white/10 flex items-center gap-3">
                     <Image src="/logo.png" alt="Logo" width={32} height={32} />
                     <span className="font-black font-unbounded text-lg tracking-tight">ADMIN</span>
                </div>
                
                <nav className="p-4 space-y-2">
                    <NavLinks />
                </nav>
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 bg-black/90 backdrop-blur-md border-b border-white/10 z-50 px-4 py-3 flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    <Image src="/logo.png" alt="Logo" width={24} height={24} />
                    <span className="font-black font-unbounded text-sm">ADMIN PANEL</span>
                 </div>
                 <button 
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                 >
                    {isMobileMenuOpen ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                    )}
                 </button>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-40 bg-black/95 pt-20 px-4 animate-in fade-in slide-in-from-top-10 duration-200">
                    <nav className="space-y-2">
                        <NavLinks />
                    </nav>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-10 mt-16 md:mt-0 md:ml-64 overflow-x-hidden w-full">
                {children}
            </main>
        </div>
    </div>
  );
}

