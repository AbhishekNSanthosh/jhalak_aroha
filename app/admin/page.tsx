"use client";

import { useRouter } from "next/navigation";
import { Users, Calendar } from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();

  return (
    <div className="space-y-8">
        <div>
            <h1 className="text-4xl md:text-5xl font-black font-unbounded text-white mb-2">
                ADMIN <span className="text-[#BA170D]">DASHBOARD</span>
            </h1>
            <p className="text-gray-400">Welcome back. Select a module to manage.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button 
                onClick={() => router.push("/admin/users")}
                className="group p-8 rounded-2xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 hover:border-[#BA170D]/50 hover:from-[#BA170D]/5 transition-all text-left"
            >
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-[#BA170D] mb-4 group-hover:scale-110 transition-transform">
                    <Users size={24} />
                </div>
                <h3 className="text-xl font-bold font-unbounded text-white mb-2 group-hover:text-[#BA170D]">USER MANAGEMENT</h3>
                <p className="text-sm text-gray-500">View registered users, manage roles, and export user data.</p>
            </button>

            <button 
                onClick={() => router.push("/admin/events")}
                className="group p-8 rounded-2xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 hover:border-[#BA170D]/50 hover:from-[#BA170D]/5 transition-all text-left"
            >
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-[#BA170D] mb-4 group-hover:scale-110 transition-transform">
                    <Calendar size={24} />
                </div>
                <h3 className="text-xl font-bold font-unbounded text-white mb-2 group-hover:text-[#BA170D]">EVENT STATS</h3>
                <p className="text-sm text-gray-500">Track event registrations, view participants, and download event-specific sheets.</p>
            </button>
        </div>
    </div>
  );
}
