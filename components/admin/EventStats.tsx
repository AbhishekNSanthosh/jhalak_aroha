"use client";

import { useEffect, useState } from "react";
import { EventStat, fetchEventStats } from "@/lib/adminService";
import { Search, Download, Users, Layers, RefreshCcw } from "lucide-react";
import * as XLSX from 'xlsx';
import { fetchAllUsersWithData } from "@/lib/adminService"; // We might need user details for export if reg doc is slim

export default function EventStats() {
    const [stats, setStats] = useState<EventStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState<'all' | 'individual' | 'group'>('all');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const data = await fetchEventStats();
        // Sort by participation high to low
        data.sort((a, b) => b.entryCount - a.entryCount);
        setStats(data);
        setLoading(false);
    };

    const handleExportEvent = async (eventStat: EventStat) => {
        setLoading(true); // Show loading state during export preparation
        try {
            const allUsers = await fetchAllUsersWithData();
            const userMap = new Map(allUsers.map(u => [u.uid, u]));

            const exportRows = [];

            for (const reg of eventStat.registrations) {
                if (reg.type === 'individual') {
                    const user = userMap.get(reg.userId);
                    exportRows.push({
                        "Chest No": reg.chestNo,
                        "Type": "Individual",
                        "Role": "Participant",
                        "Name": user?.name || "Unknown",
                        "College ID": user?.collegeId || "-",
                        "Email": user?.email || "-",
                        "Mobile": user?.mobile || "-",
                        "Department": user?.department || "-",
                        "Semester": user?.semester || "-",
                        "House": user?.house || "-",
                        "Registered At": reg.registeredAt ? new Date(reg.registeredAt.seconds * 1000).toLocaleString() : "-"
                    });
                } else if (reg.type === 'team') {
                    const leader = userMap.get(reg.leaderId);
                    
                    // Add Leader Row
                    exportRows.push({
                        "Chest No": reg.chestNo,
                        "Type": "Team",
                        "Role": "Team Leader",
                        "Name": leader?.name || "Unknown",
                        "College ID": leader?.collegeId || "-",
                        "Email": leader?.email || "-",
                        "Mobile": leader?.mobile || "-",
                        "Department": leader?.department || "-",
                        "Semester": leader?.semester || "-",
                        "House": leader?.house || "-",
                        "Registered At": reg.registeredAt ? new Date(reg.registeredAt.seconds * 1000).toLocaleString() : "-"
                    });

                    // Add Member Rows
                    if (reg.memberIds && Array.isArray(reg.memberIds)) {
                        for (const memberId of reg.memberIds) {
                            if (memberId === reg.leaderId) continue; // Skip if leader is in member list (unlikely but safe)
                            
                            const member = userMap.get(memberId);
                            exportRows.push({
                                "Chest No": reg.chestNo,
                                "Type": "Team",
                                "Role": "Member",
                                "Name": member?.name || "Unknown",
                                "College ID": member?.collegeId || "-",
                                "Email": member?.email || "-",
                                "Mobile": member?.mobile || "-",
                                "Department": member?.department || "-",
                                "Semester": member?.semester || "-",
                                "House": member?.house || "-",
                                "Registered At": reg.registeredAt ? new Date(reg.registeredAt.seconds * 1000).toLocaleString() : "-"
                            });
                        }
                    }
                }
            }

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(exportRows);
            
            // Auto-width columns roughly
            const wscols = [
                {wch: 10}, // Chest No
                {wch: 10}, // Type
                {wch: 12}, // Role
                {wch: 20}, // Name
                {wch: 15}, // College ID
                {wch: 25}, // Email
                {wch: 12}, // Mobile
                {wch: 10}, // Dept
                {wch: 5},  // Sem
                {wch: 10}, // House
                {wch: 20}  // Reg At
            ];
            ws['!cols'] = wscols;

            XLSX.utils.book_append_sheet(wb, ws, eventStat.shortCode);
            XLSX.writeFile(wb, `jhalak_${eventStat.shortCode}_participants.xlsx`);
        } catch (error) {
            console.error("Export failed:", error);
            alert("Export failed. See console for details.");
        } finally {
            setLoading(false);
        }
    };

    const filteredStats = stats.filter(stat => {
        const matchesSearch = stat.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              stat.shortCode.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'all' || stat.type === typeFilter;
        return matchesSearch && matchesType;
    });

    if (loading) return <div className="text-white text-center py-20 animate-pulse font-unbounded">LOADING STATS...</div>;

    const totalEntries = stats.reduce((acc, curr) => acc + curr.entryCount, 0);
    const totalParticipants = stats.reduce((acc, curr) => acc + curr.participantCount, 0);

    return (
        <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-purple-900/50 to-black p-6 rounded-xl border border-white/10">
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Total Events</h3>
                    <p className="text-3xl font-black text-white font-unbounded">{stats.length}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-900/50 to-black p-6 rounded-xl border border-white/10">
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Total Entries</h3>
                    <p className="text-3xl font-black text-white font-unbounded">{totalEntries}</p>
                </div>
                <div className="bg-gradient-to-br from-[#BA170D]/20 to-black p-6 rounded-xl border border-white/10">
                    <h3 className="text-[#BA170D] text-xs font-bold uppercase tracking-widest mb-1">Total Participants</h3>
                    <p className="text-3xl font-black text-[#BA170D] font-unbounded">{totalParticipants}</p>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search events..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:border-[#BA170D] focus:outline-none transition-colors"
                    />
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <select 
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value as any)}
                        className="bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#BA170D] focus:outline-none"
                    >
                        <option value="all">All Types</option>
                        <option value="individual">Individual</option>
                        <option value="group">Group</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider font-bold">
                        <tr>
                            <th className="p-4">Event</th>
                            <th className="p-4">Type</th>
                            <th className="p-4 text-center">Entries</th>
                            <th className="p-4 text-center">Participants</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 text-sm">
                        {filteredStats.map(stat => (
                            <tr key={stat.title} className="hover:bg-white/5 transition-colors group">
                                <td className="p-4">
                                    <div>
                                        <p className="font-bold text-white group-hover:text-[#BA170D] transition-colors">{stat.title}</p>
                                        <p className="text-gray-500 text-xs">{stat.shortCode} • {stat.category}</p>
                                    </div>
                                </td>
                                <td className="p-4">
                                    {stat.type === 'individual' ? (
                                        <span className="flex items-center gap-1 text-blue-400 text-xs font-bold uppercase"><Users size={12}/> Solo</span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-purple-400 text-xs font-bold uppercase"><Layers size={12}/> Group</span>
                                    )}
                                </td>
                                <td className="p-4 text-center font-mono text-white/80">
                                    {stat.entryCount}
                                </td>
                                <td className="p-4 text-center font-mono text-white">
                                    {stat.participantCount}
                                </td>
                                <td className="p-4 text-right">
                                    <button 
                                        onClick={() => handleExportEvent(stat)}
                                        disabled={stat.entryCount === 0}
                                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${
                                            stat.entryCount === 0 
                                            ? "border-white/5 text-gray-600 cursor-not-allowed"
                                            : "border-white/20 text-white hover:bg-[#BA170D] hover:text-white hover:border-[#BA170D]"
                                        }`}
                                    >
                                        <Download size={14} /> EXPORT
                                    </button>
                                    <button 
                                        onClick={async () => {
                                            if (confirm(`⚠️ DANGER: Are you sure you want to WIPE ALL DATA for ${stat.title}?\n\nThis will:\n1. Delete all participants/teams for this event.\n2. Remove the event from users' profiles.\n3. Reset the chest number counter to 0.\n\nThis action cannot be undone.`)) {
                                                const { resetEventCounter } = await import("@/lib/adminService");
                                                const res = await resetEventCounter(stat.title);
                                                if (res.success) {
                                                    alert(res.message);
                                                    loadData(); // Reload stats
                                                }
                                                else alert("Failed: " + res.message);
                                            }
                                        }}
                                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border border-white/20 text-red-500 hover:bg-red-600 hover:text-white transition-colors ml-2"
                                        title="Reset Counter & Wipe Data"
                                    >
                                        <RefreshCcw size={14} />
                                    </button>


                                </td>

                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredStats.length === 0 && (
                    <div className="p-10 text-center text-gray-500">
                        No events found.
                    </div>
                )}
            </div>
        </div>
    );
}
