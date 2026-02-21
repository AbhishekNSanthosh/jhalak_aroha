"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EventStat, fetchEventStats } from "@/lib/adminService";
import {
  Search,
  Download,
  Users,
  Layers,
  RefreshCcw,
  Eye,
  Power,
} from "lucide-react";
import ExportOptionsModal from "./ExportOptionsModal";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import ConfirmToast from "@/components/ConfirmToast";
import { fetchAllUsersWithData } from "@/lib/adminService";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { User } from "firebase/auth";

export default function EventStats({ user }: { user: User | null }) {
  const router = useRouter();
  const [stats, setStats] = useState<EventStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "individual" | "group">(
    "all",
  );
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedEventForExport, setSelectedEventForExport] =
    useState<EventStat | null>(null);

  const ALL_EXPORT_FIELDS = [
    "Chest No",
    "Individual Chest No",
    "Type",
    "Role",
    "Name",
    "College ID",
    "Email",
    "Mobile",
    "Department",
    "Semester",
    "House",
    "Registered At",
  ];

  useEffect(() => {
    const checkRole = async () => {
      if (user && db) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
        }
      }
    };
    if (user) checkRole();
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchEventStats();
    // Sort by participation high to low
    data.sort((a, b) => b.entryCount - a.entryCount);
    setStats(data);
    setLoading(false);
  };

  const handleExportClick = (eventStat: EventStat) => {
    setSelectedEventForExport(eventStat);
    setIsExportModalOpen(true);
  };

  const processExport = async (selectedFields: string[]) => {
    if (!selectedEventForExport) return;
    const eventStat = selectedEventForExport;

    setLoading(true);
    setIsExportModalOpen(false);
    try {
      const allUsers = await fetchAllUsersWithData();
      const userMap = new Map(allUsers.map((u) => [u.uid, u]));

      const exportRows = [];

      for (const reg of eventStat.registrations) {
        if (reg.type === "individual") {
          const user = userMap.get(reg.userId);
          const fullRow = {
            "Chest No": reg.userChestNo || reg.chestNo || "-",
            "Individual Chest No": reg.userChestNo || "-",
            Type: "Individual",
            Role: "Participant",
            Name: user?.name || "Unknown",
            "College ID": user?.collegeId || "-",
            Email: user?.email || "-",
            Mobile: user?.mobile || "-",
            Department: user?.department || "-",
            Semester: user?.semester || "-",
            House: user?.house || "-",
            "Registered At": reg.registeredAt
              ? new Date(reg.registeredAt.seconds * 1000).toLocaleString()
              : "-",
          };
          exportRows.push(fullRow);
        } else if (reg.type === "team") {
          const leader = userMap.get(reg.leaderId);

          // Add Leader Row
          const leaderRow = {
            "Chest No": reg.teamChestNo || reg.chestNo || "-",
            "Individual Chest No": reg.leaderChestNo || "-",
            Type: "Team",
            Role: "Team Leader",
            Name: leader?.name || "Unknown",
            "College ID": leader?.collegeId || "-",
            Email: leader?.email || "-",
            Mobile: leader?.mobile || "-",
            Department: leader?.department || "-",
            Semester: leader?.semester || "-",
            House: leader?.house || "-",
            "Registered At": reg.registeredAt
              ? new Date(reg.registeredAt.seconds * 1000).toLocaleString()
              : "-",
          };
          exportRows.push(leaderRow);

          // Add Member Rows
          if (reg.memberIds && Array.isArray(reg.memberIds)) {
            for (const memberId of reg.memberIds) {
              if (memberId === reg.leaderId) continue;

              const member = userMap.get(memberId);
              const indChestNo =
                reg.memberChestNos && reg.memberChestNos[memberId]
                  ? reg.memberChestNos[memberId]
                  : "-";

              const memberRow = {
                "Chest No": reg.teamChestNo || reg.chestNo || "-",
                "Individual Chest No": indChestNo,
                Type: "Team",
                Role: "Member",
                Name: member?.name || "Unknown",
                "College ID": member?.collegeId || "-",
                Email: member?.email || "-",
                Mobile: member?.mobile || "-",
                Department: member?.department || "-",
                Semester: member?.semester || "-",
                House: member?.house || "-",
                "Registered At": reg.registeredAt
                  ? new Date(reg.registeredAt.seconds * 1000).toLocaleString()
                  : "-",
              };
              exportRows.push(memberRow);
            }
          }
        }
      }

      // Filter fields
      const finalRows = exportRows.map((row) => {
        const filtered: Record<string, string | number> = {};
        selectedFields.forEach((field) => {
          // @ts-expect-error - field dynamically checked
          filtered[field] = row[field];
        });
        return filtered;
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(finalRows);

      const wscols = selectedFields.map((field) => {
        const maxLen = Math.max(
          field.length,
          ...finalRows.map((r) => String(r[field] || "").length),
        );
        return { wch: Math.min(Math.max(maxLen + 2, 10), 50) };
      });
      ws["!cols"] = wscols;

      XLSX.utils.book_append_sheet(wb, ws, eventStat.shortCode);
      XLSX.writeFile(wb, `jhalak_${eventStat.shortCode}_participants.xlsx`);
      toast.success("Export successful!");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Export failed. See console for details.");
    } finally {
      setLoading(false);
      setSelectedEventForExport(null);
    }
  };

  const filteredStats = stats.filter((stat) => {
    const matchesSearch =
      stat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stat.shortCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || stat.type === typeFilter;
    return matchesSearch && matchesType;
  });

  if (loading)
    return (
      <div className="space-y-6">
        {/* Scanning progress bar */}
        <div className="w-full h-[2px] bg-white/5 rounded-full overflow-hidden relative">
          <div
            className="absolute inset-y-0 w-1/3 rounded-full"
            style={{
              background:
                "linear-gradient(90deg, transparent, #BA170D, transparent)",
              animation: "eventScan 1.4s ease-in-out infinite",
            }}
          />
        </div>

        {/* Overview Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white/5 p-6 rounded-xl border border-white/10 shimmer h-[104px]"
            />
          ))}
        </div>

        {/* Controls skeleton */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
          <div className="h-9 w-full md:w-96 rounded-lg bg-white/5 shimmer" />
          <div className="h-9 w-full md:w-32 rounded-lg bg-white/5 shimmer" />
        </div>

        {/* Table skeleton */}
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <div className="bg-white/5 grid grid-cols-6 gap-4 px-4 py-3 border-b border-white/10">
            {[
              "Event",
              "Type",
              "Entries",
              "Participants",
              "Status",
              "Actions",
            ].map((col) => (
              <div key={col} className="h-3 rounded-full bg-white/10 shimmer" />
            ))}
          </div>

          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-6 gap-4 px-4 py-4 border-b border-white/5 items-center"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="space-y-2 col-span-1">
                <div className="h-3 w-3/4 rounded-full bg-white/8 shimmer" />
                <div className="h-2 w-1/2 rounded-full bg-white/5 shimmer" />
              </div>
              <div className="h-4 w-16 rounded-full bg-white/5 shimmer" />
              <div className="h-4 w-8 rounded-full bg-white/5 shimmer mx-auto" />
              <div className="h-4 w-8 rounded-full bg-white/5 shimmer mx-auto" />
              <div className="h-8 w-8 rounded-full bg-white/5 shimmer mx-auto" />
              <div className="h-9 w-24 rounded-lg bg-white/5 shimmer ml-auto" />
            </div>
          ))}
        </div>

        <style>{`
          @keyframes eventScan {
            0%   { left: -33%; }
            100% { left: 133%; }
          }
          .shimmer {
            position: relative;
            overflow: hidden;
          }
          .shimmer::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%);
            animation: shimmerSlide 1.6s ease-in-out infinite;
          }
          @keyframes shimmerSlide {
            0%   { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
      </div>
    );

  const totalEntries = stats.reduce((acc, curr) => acc + curr.entryCount, 0);
  const totalParticipants = stats.reduce(
    (acc, curr) => acc + curr.participantCount,
    0,
  );

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-linear-to-br from-purple-900/50 to-black p-6 rounded-xl border border-white/10">
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">
            Total Events
          </h3>
          <p className="text-3xl font-black text-white font-unbounded">
            {stats.length}
          </p>
        </div>
        <div className="bg-linear-to-br from-blue-900/50 to-black p-6 rounded-xl border border-white/10">
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">
            Total Entries
          </h3>
          <p className="text-3xl font-black text-white font-unbounded">
            {totalEntries}
          </p>
        </div>
        <div className="bg-linear-to-br from-[#BA170D]/20 to-black p-6 rounded-xl border border-white/10">
          <h3 className="text-[#BA170D] text-xs font-bold uppercase tracking-widest mb-1">
            Total Participants
          </h3>
          <p className="text-3xl font-black text-[#BA170D] font-unbounded">
            {totalParticipants}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
        <div className="relative w-full md:w-96">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
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
            onChange={(e) =>
              setTypeFilter(e.target.value as "all" | "individual" | "group")
            }
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
              <th className="p-4 text-center">Reg. Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 text-sm">
            {filteredStats.map((stat) => (
              <tr
                key={stat.title}
                className="hover:bg-white/5 transition-colors group"
              >
                <td className="p-4">
                  <div>
                    <p className="font-bold text-white group-hover:text-[#BA170D] transition-colors">
                      {stat.title}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {stat.shortCode} • {stat.category}
                    </p>
                  </div>
                </td>
                <td className="p-4">
                  {stat.type === "individual" ? (
                    <span className="flex items-center gap-1 text-blue-400 text-xs font-bold uppercase">
                      <Users size={12} /> Solo
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-purple-400 text-xs font-bold uppercase">
                      <Layers size={12} /> Group
                    </span>
                  )}
                </td>
                <td className="p-4 text-center font-mono text-white/80">
                  {stat.entryCount}
                </td>
                <td className="p-4 text-center font-mono text-white">
                  {stat.participantCount}
                </td>
                <td className="p-4 text-center">
                  {userRole === "admin" && (
                    <button
                      onClick={async () => {
                        const { toggleEventRegistration } =
                          await import("@/lib/adminService");
                        const res = await toggleEventRegistration(
                          stat.title,
                          stat.isRegistrationClosed,
                        );
                        if (res.success) {
                          toast.success(res.message || "Status updated");
                          loadData();
                        } else {
                          toast.error(res.message || "Failed to update status");
                        }
                      }}
                      className={`p-2 rounded-full transition-all ${
                        stat.isRegistrationClosed
                          ? "bg-gray-800 text-gray-500 hover:text-red-500"
                          : "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                      }`}
                      title={
                        stat.isRegistrationClosed
                          ? "Registration Closed - Click to Open"
                          : "Registration Open - Click to Close"
                      }
                    >
                      <Power size={18} />
                    </button>
                  )}
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() =>
                      router.push(
                        `/admin/events/${encodeURIComponent(stat.title)}`,
                      )
                    }
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border border-white/20 text-blue-400 hover:bg-blue-900/50 hover:text-blue-200 transition-colors mr-2"
                    title="View Detailed List"
                  >
                    <Eye size={14} /> VIEW
                  </button>
                  <button
                    onClick={() => handleExportClick(stat)}
                    disabled={stat.entryCount === 0}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${
                      stat.entryCount === 0
                        ? "border-white/5 text-gray-600 cursor-not-allowed"
                        : "border-white/20 text-white hover:bg-[#BA170D] hover:text-white hover:border-[#BA170D]"
                    }`}
                  >
                    <Download size={14} /> EXPORT
                  </button>
                  {userRole === "admin" && (
                    <button
                      onClick={() => {
                        toast.custom(
                          (t) => (
                            <ConfirmToast
                              t={t}
                              message={`⚠️ DANGER: Are you sure you want to WIPE ALL DATA for ${stat.title}?\n\nThis will:\n1. Delete all participants/teams for this event.\n2. Remove the event from users' profiles.\n3. Reset the chest number counter to 0.\n\nThis action cannot be undone.`}
                              onConfirm={async () => {
                                const { resetEventCounter } =
                                  await import("@/lib/adminService");
                                const res = await resetEventCounter(stat.title);
                                if (res.success) {
                                  toast.success(
                                    res.message || "Reset complete",
                                  );
                                  loadData(); // Reload stats
                                } else {
                                  toast.error(
                                    "Failed: " +
                                      (res.message || "Unknown error"),
                                  );
                                }
                              }}
                            />
                          ),
                          { duration: Infinity },
                        );
                      }}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border border-white/20 text-red-500 hover:bg-red-600 hover:text-white transition-colors ml-2"
                      title="Reset Counter & Wipe Data"
                    >
                      <RefreshCcw size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredStats.length === 0 && (
          <div className="p-10 text-center text-gray-500">No events found.</div>
        )}
      </div>

      <ExportOptionsModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={processExport}
        allFields={ALL_EXPORT_FIELDS}
      />
    </div>
  );
}
