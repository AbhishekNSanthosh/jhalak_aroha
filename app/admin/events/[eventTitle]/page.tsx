"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import {
  DetailedRegistration,
  fetchDetailedEventRegistrations,
  adminMarkParticipation,
  adminBulkMarkParticipation,
} from "@/lib/adminService";
import {
  Search,
  ChevronLeft,
  Download,
  Users,
  Mail,
  Phone,
  Hash,
  Calendar,
  User,
  Crown,
  Trash2,
  Plus,
  X,
  CheckCircle2,
  XCircle,
  CheckCheck,
  ListChecks,
  Filter,
  ScanLine,
} from "lucide-react";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import ConfirmToast from "@/components/ConfirmToast";
import ExportOptionsModal from "@/components/admin/ExportOptionsModal";
import {
  adminAddUserToEvent,
  adminRemoveUserFromEvent,
} from "@/lib/adminService";

type ParticipationFilter = "all" | "participated" | "not_participated";

export default function EventDetailedView() {
  const params = useParams();
  const router = useRouter();
  const eventTitle = decodeURIComponent(params.eventTitle as string);

  const [registrations, setRegistrations] = useState<DetailedRegistration[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"chestNo" | "name" | "time" | "house">(
    "chestNo",
  );
  const [selectedHouse, setSelectedHouse] = useState<string | null>(null);
  const [participationFilter, setParticipationFilter] =
    useState<ParticipationFilter>("all");

  // Optimistic participation state: map of regId -> participated boolean
  const [participationMap, setParticipationMap] = useState<
    Record<string, boolean>
  >({});
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  // Role-based access
  const [userRole, setUserRole] = useState<string | null>(null);
  const canManageUsers = userRole === "admin" || userRole === "moderator";

  // Export
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Add User
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [addingUser, setAddingUser] = useState(false);

  // Chest No Scanner
  const [scanInput, setScanInput] = useState("");
  const [scanResult, setScanResult] = useState<{
    name: string;
    participated: boolean;
    regId: string;
  } | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanLoading, setScanLoading] = useState(false);

  const houses = [
    {
      name: "Red House",
      color: "bg-red-500",
      border: "border-red-500",
      key: "red",
    },
    {
      name: "Blue House",
      color: "bg-blue-500",
      border: "border-blue-500",
      key: "blue",
    },
    {
      name: "Green House",
      color: "bg-green-500",
      border: "border-green-500",
      key: "green",
    },
    {
      name: "Yellow House",
      color: "bg-yellow-500",
      border: "border-yellow-500",
      key: "yellow",
    },
  ];

  useEffect(() => {
    if (eventTitle) loadData();
  }, [eventTitle]);

  // Fetch current user role
  useEffect(() => {
    if (!auth || !db) return;
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      const snap = await getDoc(doc(db!, "users", user.uid));
      if (snap.exists()) setUserRole(snap.data().role ?? "user");
    });
    return () => unsub();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchDetailedEventRegistrations(eventTitle);
    setRegistrations(data);
    // Initialise optimistic map from fetched data
    const map: Record<string, boolean> = {};
    data.forEach((r) => {
      map[r.id] = r.participated || false;
    });
    setParticipationMap(map);
    setLoading(false);
  };

  // ── Chest No Scanner ─────────────────────────────────────────────────────
  const handleChestScan = useCallback(
    async (raw: string) => {
      const input = raw.trim();
      if (!input) return;

      // Find the registration whose chestNo matches
      const reg = registrations.find(
        (r) =>
          r.chestNo.trim().toLowerCase() === input.toLowerCase() ||
          (r.leaderChestNo &&
            r.leaderChestNo.trim().toLowerCase() === input.toLowerCase()) ||
          (r.members &&
            r.members.some(
              (m) => m.chestNo.trim().toLowerCase() === input.toLowerCase(),
            )),
      );

      if (!reg) {
        setScanError(`No registration found for chest no "${input}"`);
        setScanResult(null);
        return;
      }

      setScanError(null);
      setScanLoading(true);

      const next = !(participationMap[reg.id] ?? false);

      // Optimistic
      setParticipationMap((prev) => ({ ...prev, [reg.id]: next }));

      const result = await adminMarkParticipation(reg.id, next);
      setScanLoading(false);

      if (result.success) {
        setScanResult({ name: reg.name, participated: next, regId: reg.id });
        setScanInput("");
      } else {
        // Revert
        setParticipationMap((prev) => ({ ...prev, [reg.id]: !next }));
        setScanError(result.message || "Failed to mark participation.");
        setScanResult(null);
      }
    },
    [registrations, participationMap],
  );

  // ── Toggle single participation ──────────────────────────────────────────
  const handleToggleParticipation = useCallback(
    async (regId: string) => {
      const current = participationMap[regId] ?? false;
      const next = !current;

      // Optimistic update
      setParticipationMap((prev) => ({ ...prev, [regId]: next }));
      setTogglingIds((prev) => new Set(prev).add(regId));

      const result = await adminMarkParticipation(regId, next);

      setTogglingIds((prev) => {
        const s = new Set(prev);
        s.delete(regId);
        return s;
      });

      if (!result.success) {
        // Revert
        setParticipationMap((prev) => ({ ...prev, [regId]: current }));
        toast.error(result.message || "Failed to update participation.");
      }
    },
    [participationMap],
  );

  // ── Bulk actions ──────────────────────────────────────────────────────────
  const handleBulkMark = async (participated: boolean) => {
    // Only operate on currently visible (filtered) registrations
    const ids = sortedRegs.map((r) => r.id);
    if (ids.length === 0) return;

    setBulkLoading(true);

    // Optimistic
    setParticipationMap((prev) => {
      const next = { ...prev };
      ids.forEach((id) => {
        next[id] = participated;
      });
      return next;
    });

    const result = await adminBulkMarkParticipation(ids, participated);
    setBulkLoading(false);

    if (result.success) {
      toast.success(result.message || "Done!");
    } else {
      // Revert optimistic update
      await loadData();
      toast.error(result.message || "Bulk update failed.");
    }
  };

  // ── Derived participation stats ───────────────────────────────────────────
  const participatedCount =
    Object.values(participationMap).filter(Boolean).length;
  const totalCount = registrations.length;

  // ── Add/Remove User ───────────────────────────────────────────────────────
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail.trim()) return;
    setAddingUser(true);
    const result = await adminAddUserToEvent(eventTitle, newUserEmail.trim());
    if (result.success) {
      toast.success(result.message || "User added!");
      setIsAddUserModalOpen(false);
      setNewUserEmail("");
      loadData();
    } else {
      toast.error(result.message || "Failed to add user.");
    }
    setAddingUser(false);
  };

  const handleRemoveUser = (
    regId: string,
    uid: string,
    type: string,
    name: string,
  ) => {
    toast.custom(
      (t) => (
        <ConfirmToast
          t={t}
          message={`Are you sure you want to remove ${name} from this event?\n\n${
            type !== "individual"
              ? "⚠️ If this user is a TEAM LEADER, the entire team will be disbanded."
              : ""
          }`}
          onConfirm={async () => {
            const result = await adminRemoveUserFromEvent(
              eventTitle,
              regId,
              uid,
              type,
            );
            if (result.success) {
              toast.success(result.message || "Removed successfully");
              loadData();
            } else {
              toast.error(result.message || "Failed to remove");
            }
          }}
        />
      ),
      { duration: Infinity },
    );
  };

  // ── Export ────────────────────────────────────────────────────────────────
  const handleExportClick = () => {
    if (registrations.length === 0) return;
    setIsExportModalOpen(true);
  };

  const allExportFields = [
    "Type",
    "Team Name",
    "Chest No (Main)",
    "Individual Chest No",
    "Role",
    "Name",
    "College ID",
    "Email",
    "Mobile",
    "House",
    "Department",
    "Semester",
    "Registered At",
    "Participated",
  ];

  const handleExportConfirm = (selectedFields: string[]) => {
    if (registrations.length === 0) return;
    const rows: any[] = [];

    registrations.forEach((reg) => {
      const mainData: any = {
        Type: reg.type.toUpperCase(),
        "Team Name": reg.teamName || "-",
        "Chest No (Main)": reg.chestNo,
        "Individual Chest No":
          reg.type === "team" ? reg.leaderChestNo || "-" : reg.chestNo,
        Role: reg.type === "team" ? "Leader" : "Participant",
        Name: reg.name,
        "College ID": reg.collegeId,
        Email: reg.email,
        Mobile: reg.mobile,
        House: reg.house,
        Department: reg.department,
        Semester: reg.semester || "-",
        "Registered At": reg.registeredAt
          ? new Date(reg.registeredAt.seconds * 1000).toLocaleString()
          : "-",
        Participated:
          (participationMap[reg.id] ?? reg.participated) ? "Yes" : "No",
      };

      const filteredMain: any = {};
      selectedFields.forEach((f) => {
        if (mainData[f] !== undefined) filteredMain[f] = mainData[f];
      });
      rows.push(filteredMain);

      if (reg.members && reg.members.length > 0) {
        reg.members.forEach((member) => {
          const memberData: any = {
            Type: "TEAM MEMBER",
            "Team Name": reg.teamName || "-",
            "Chest No (Main)": reg.chestNo,
            "Individual Chest No": member.chestNo,
            Role: "Member",
            Name: member.name,
            "College ID": member.collegeId,
            Email: member.email,
            Mobile: member.mobile,
            House: member.house,
            Department: member.department,
            Semester: member.semester || "-",
            "Registered At": "-",
            Participated:
              (participationMap[reg.id] ?? reg.participated) ? "Yes" : "No",
          };
          const filteredMember: any = {};
          selectedFields.forEach((f) => {
            if (memberData[f] !== undefined) filteredMember[f] = memberData[f];
          });
          rows.push(filteredMember);
        });
      }
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    const colWidths = selectedFields.map((key) => ({
      wch:
        Math.max(
          key.length,
          ...rows.map((r) => (r[key] ? r[key].toString().length : 0)),
        ) + 2,
    }));
    ws["!cols"] = colWidths;
    const safeTitle = eventTitle.replace(/[^a-z0-9]/gi, "_").substring(0, 30);
    XLSX.utils.book_append_sheet(wb, ws, "Participants");
    XLSX.writeFile(wb, `jhalak_${safeTitle}_detailed.xlsx`);
    toast.success("Excel exported!");
    setIsExportModalOpen(false);
  };

  // ── Filter + Sort ─────────────────────────────────────────────────────────
  const filteredRegs = registrations.filter((reg) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      reg.name.toLowerCase().includes(term) ||
      reg.email.toLowerCase().includes(term) ||
      reg.chestNo.toLowerCase().includes(term) ||
      reg.mobile.includes(term) ||
      (reg.teamName && reg.teamName.toLowerCase().includes(term)) ||
      (reg.members &&
        reg.members.some(
          (m) =>
            m.name.toLowerCase().includes(term) || m.chestNo.includes(term),
        ));

    if (!matchesSearch) return false;

    if (selectedHouse) {
      const houseKey = selectedHouse.toLowerCase();
      if (reg.house && reg.house.toLowerCase().includes(houseKey)) {
        /* ok */
      } else if (
        reg.members &&
        reg.members.some(
          (m) => m.house && m.house.toLowerCase().includes(houseKey),
        )
      ) {
        /* ok */
      } else return false;
    }

    // Participation filter uses the optimistic map
    const isParticipated =
      participationMap[reg.id] ?? reg.participated ?? false;
    if (participationFilter === "participated" && !isParticipated) return false;
    if (participationFilter === "not_participated" && isParticipated)
      return false;

    return true;
  });

  const sortedRegs = [...filteredRegs].sort((a, b) => {
    if (selectedHouse) {
      const deptCompare = (a.department || "").localeCompare(
        b.department || "",
      );
      if (deptCompare !== 0) return deptCompare;
      const semCompare = (a.semester || "").localeCompare(b.semester || "");
      if (semCompare !== 0) return semCompare;
    }
    if (sortBy === "chestNo")
      return a.chestNo.localeCompare(b.chestNo, undefined, { numeric: true });
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "house") return (a.house || "").localeCompare(b.house || "");
    const tA = a.registeredAt?.seconds || 0;
    const tB = b.registeredAt?.seconds || 0;
    return tB - tA;
  });

  const getHouseColor = (house: string) => {
    const n = (house || "").toLowerCase();
    if (n.includes("red") || n.includes("ruby"))
      return "text-red-500 border-red-500/50 bg-red-500/10";
    if (n.includes("blue") || n.includes("sapphire"))
      return "text-blue-500 border-blue-500/50 bg-blue-500/10";
    if (n.includes("green") || n.includes("emerald"))
      return "text-green-500 border-green-500/50 bg-green-500/10";
    if (n.includes("yellow") || n.includes("topaz"))
      return "text-yellow-500 border-yellow-500/50 bg-yellow-500/10";
    return "text-purple-400 border-purple-500/50 bg-purple-500/10";
  };

  const totalParticipants = registrations.reduce(
    (acc, curr) => acc + 1 + (curr.members?.length || 0),
    0,
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Navigation & Header Skeleton */}
        <div className="flex flex-col gap-6">
          <div className="h-4 w-32 bg-white/5 rounded shimmer" />
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/10 pb-6">
            <div className="space-y-4 w-full md:w-1/2">
              <div className="h-12 w-3/4 bg-white/5 rounded-lg shimmer" />
              <div className="flex gap-4">
                <div className="h-4 w-24 bg-white/5 rounded shimmer" />
                <div className="h-4 w-24 bg-white/5 rounded shimmer" />
                <div className="h-4 w-32 bg-white/5 rounded shimmer" />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="h-10 w-28 bg-white/5 rounded-full shimmer" />
              <div className="h-10 w-32 bg-white/5 rounded-full shimmer" />
            </div>
          </div>
        </div>

        {/* Participation Tracker Skeleton */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between">
            <div className="h-4 w-40 bg-white/10 rounded shimmer" />
            <div className="h-4 w-24 bg-white/10 rounded shimmer" />
          </div>
          <div className="h-2 w-full bg-white/5 rounded-full shimmer" />
          <div className="flex gap-2">
            <div className="h-8 w-40 bg-white/10 rounded-full shimmer" />
            <div className="h-8 w-24 bg-white/10 rounded-full shimmer" />
          </div>
        </div>

        {/* Filters Skeleton */}
        <div className="h-14 w-full bg-white/5 border border-white/10 rounded-2xl shimmer" />

        {/* House Filters Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 bg-white/5 rounded-xl border border-white/10 shimmer"
            />
          ))}
        </div>

        {/* Registration Cards Skeleton */}
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 bg-white/5 border border-white/10 rounded-2xl shimmer"
            />
          ))}
        </div>

        <style>{`
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
  }

  const participationPercent =
    totalCount > 0 ? Math.round((participatedCount / totalCount) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Top Navigation & Header */}
      <div className="flex flex-col gap-6">
        <button
          onClick={() => router.back()}
          className="self-start flex items-center gap-2 text-white/40 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest group"
        >
          <ChevronLeft
            size={16}
            className="group-hover:-translate-x-1 transition-transform"
          />
          Back to Events
        </button>

        <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-white font-unbounded tracking-tighter uppercase mb-2">
              {eventTitle}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-400 font-mono flex-wrap">
              <span className="flex items-center gap-2">
                <Users size={14} className="text-[#BA170D]" />
                <span className="text-white font-bold">
                  {registrations.length}
                </span>{" "}
                Entries
              </span>
              <span className="w-1 h-1 bg-white/20 rounded-full" />
              <span className="flex items-center gap-2">
                <User size={14} className="text-[#BA170D]" />
                <span className="text-white font-bold">
                  {totalParticipants}
                </span>{" "}
                Participants
              </span>
              <span className="w-1 h-1 bg-white/20 rounded-full" />
              <span className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-green-500" />
                <span className="text-green-400 font-bold">
                  {participatedCount}
                </span>
                <span className="text-gray-500">
                  / {totalCount} Participated
                </span>
              </span>
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            {canManageUsers && (
              <button
                onClick={() => setIsAddUserModalOpen(true)}
                className="flex items-center gap-2 bg-[#BA170D] text-white hover:bg-[#a0140b] px-6 py-3 rounded-full transition-all font-bold text-xs uppercase tracking-wider"
              >
                <Plus size={16} /> Add User
              </button>
            )}
            <button
              onClick={handleExportClick}
              disabled={registrations.length === 0}
              className="flex items-center gap-2 bg-white text-black hover:bg-[#BA170D] hover:text-white px-6 py-3 rounded-full transition-all font-bold text-xs uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={16} /> Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* ── Participation Progress Bar ── */}
      <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListChecks size={16} className="text-[#BA170D]" />
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Participation Tracker
            </span>
          </div>
          <span className="text-xs font-mono text-gray-500">
            {participatedCount} / {totalCount} &nbsp;·&nbsp;
            <span className="text-green-400 font-bold">
              {participationPercent}%
            </span>
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${participationPercent}%`,
              background: "linear-gradient(90deg, #7a0d07, #BA170D, #22c55e)",
            }}
          />
        </div>

        {/* Bulk action buttons */}
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={() => handleBulkMark(true)}
            disabled={bulkLoading}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-all disabled:opacity-50"
          >
            <CheckCheck size={13} />
            {participationFilter === "all"
              ? "Mark All as Participated"
              : `Mark ${sortedRegs.length} Visible`}
          </button>
          <button
            onClick={() => handleBulkMark(false)}
            disabled={bulkLoading}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-50"
          >
            <XCircle size={13} />
            Clear
            {participationFilter !== "all"
              ? ` ${sortedRegs.length} Visible`
              : " All"}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-4 z-10 bg-black/80 backdrop-blur-xl border border-white/10 p-2 rounded-2xl flex flex-col md:flex-row gap-2 shadow-2xl">
        <div className="relative flex-1 group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#BA170D] transition-colors"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by name, chest no, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-white px-12 py-3 placeholder:text-gray-600 font-medium"
          />
        </div>

        <div className="h-full w-px bg-white/10 hidden md:block" />

        {/* Participation filter tabs */}
        <div className="flex items-center gap-1 px-2">
          <Filter size={12} className="text-gray-500 mr-1" />
          {(
            ["all", "participated", "not_participated"] as ParticipationFilter[]
          ).map((v) => (
            <button
              key={v}
              onClick={() => setParticipationFilter(v)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                participationFilter === v
                  ? v === "participated"
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : v === "not_participated"
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : "bg-white/10 text-white border border-white/20"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {v === "all"
                ? "All"
                : v === "participated"
                  ? "✓ Done"
                  : "✗ Pending"}
            </button>
          ))}
        </div>

        <div className="h-full w-px bg-white/10 hidden md:block" />

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="bg-transparent text-gray-400 hover:text-white font-bold text-xs uppercase tracking-wider px-4 py-3 outline-none cursor-pointer border-none"
        >
          <option value="chestNo" className="bg-black text-white">
            Sort: Chest No
          </option>
          <option value="name" className="bg-black text-white">
            Sort: Name
          </option>
          <option value="house" className="bg-black text-white">
            Sort: House
          </option>
          <option value="time" className="bg-black text-white">
            Sort: Recent
          </option>
        </select>
      </div>

      {/* House Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {houses.map((house) => {
          const count = registrations.filter(
            (r) =>
              (r.house && r.house.toLowerCase().includes(house.key)) ||
              (r.members &&
                r.members.some(
                  (m) => m.house && m.house.toLowerCase().includes(house.key),
                )),
          ).length;
          const isSelected = selectedHouse === house.key;

          return (
            <button
              key={house.key}
              onClick={() => setSelectedHouse(isSelected ? null : house.key)}
              className={`relative p-4 rounded-xl border transition-all duration-300 overflow-hidden group ${
                isSelected
                  ? `${house.color} border-transparent text-white`
                  : "border-white/5 bg-white/5 hover:border-white/20 text-gray-400"
              }`}
            >
              <div
                className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity ${house.color}`}
              />
              <div className="relative z-10 flex flex-col items-start gap-1">
                <span
                  className={`text-xs font-bold uppercase tracking-widest ${isSelected ? "text-white" : "text-gray-400"}`}
                >
                  {house.name}
                </span>
                <span className="text-2xl font-black font-unbounded text-white">
                  {count}
                </span>
              </div>
              {isSelected && (
                <div
                  className={`absolute top-0 right-0 w-16 h-16 blur-2xl -mr-8 -mt-8 ${house.color} opacity-20`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Registration Cards */}
      <div className="grid grid-cols-1 gap-4">
        {sortedRegs.map((reg, index) => {
          const currentGroup = `${reg.department || "Unknown"} - ${reg.semester || "?"}`;
          const prevReg = index > 0 ? sortedRegs[index - 1] : null;
          const prevGroup = prevReg
            ? `${prevReg.department || "Unknown"} - ${prevReg.semester || "?"}`
            : null;
          const showHeader = selectedHouse && currentGroup !== prevGroup;
          const isParticipated =
            participationMap[reg.id] ?? reg.participated ?? false;
          const isToggling = togglingIds.has(reg.id);

          return (
            <div key={reg.id} className="contents">
              {showHeader && (
                <div className="mt-8 mb-4 flex items-center gap-4">
                  <div className="h-px flex-1 bg-white/20" />
                  <h2 className="text-xl font-black text-white/80 font-unbounded uppercase tracking-wider">
                    {currentGroup}
                  </h2>
                  <div className="h-px flex-1 bg-white/20" />
                </div>
              )}

              <div
                className={`group relative border rounded-2xl overflow-hidden transition-all duration-300 ${
                  isParticipated
                    ? "bg-green-950/20 border-green-500/20 hover:border-green-500/40"
                    : "bg-[#0A0A0A] hover:bg-[#111] border-white/5 hover:border-white/20"
                }`}
              >
                {/* Participated indicator strip */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 ${isParticipated ? "bg-green-500" : "bg-transparent"}`}
                />

                <div className="p-6 grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-6 items-center">
                  {/* Chest Number Badge */}
                  <div
                    className={`flex flex-col items-center justify-center w-20 h-20 rounded-xl border transition-colors ${
                      isParticipated
                        ? "bg-green-500/15 border-green-500/30 group-hover:bg-green-500 group-hover:border-transparent"
                        : "bg-[#BA170D]/10 border-[#BA170D]/20 group-hover:bg-[#BA170D]"
                    } group-hover:text-white`}
                  >
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">
                      Chest
                    </span>
                    <span className="text-2xl font-black font-unbounded tracking-tighter">
                      {reg.chestNo}
                    </span>
                  </div>

                  {/* Main Details */}
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3
                        className={`text-xl font-bold text-white transition-colors ${isParticipated ? "group-hover:text-green-400" : "group-hover:text-[#BA170D]"}`}
                      >
                        {reg.name}
                      </h3>
                      {reg.type === "team" && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-[10px] font-bold uppercase tracking-wide">
                          <Crown size={10} /> Team Leader
                        </span>
                      )}
                      {reg.teamName && (
                        <span className="text-gray-500 text-sm">
                          Of Team{" "}
                          <strong className="text-gray-300">
                            {reg.teamName}
                          </strong>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
                      {reg.house && reg.house !== "-" && (
                        <span
                          className={`px-2 py-1 rounded border ${getHouseColor(reg.house)}`}
                        >
                          {reg.house}
                        </span>
                      )}
                      {reg.department && reg.department !== "-" && (
                        <span className="px-2 py-1 rounded border border-white/10 bg-white/5 text-gray-300">
                          {reg.department}
                        </span>
                      )}
                      {reg.semester && reg.semester !== "-" && (
                        <span className="px-2 py-1 rounded border border-white/10 bg-white/5 text-gray-400">
                          {reg.semester}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs text-gray-400 font-mono">
                      <div className="flex items-center gap-1.5 hover:text-white transition-colors">
                        <Mail size={12} />
                        {reg.email}
                      </div>
                      <div className="flex items-center gap-1.5 hover:text-white transition-colors">
                        <Phone size={12} />
                        {reg.mobile}
                      </div>
                      <div className="flex items-center gap-1.5 hover:text-white transition-colors">
                        <Hash size={12} />
                        {reg.collegeId}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="text-right space-y-3 flex flex-col items-end">
                    {/* Participation Toggle */}
                    <button
                      onClick={() => handleToggleParticipation(reg.id)}
                      disabled={isToggling}
                      title={
                        isParticipated
                          ? "Mark as Not Participated"
                          : "Mark as Participated"
                      }
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 border ${
                        isParticipated
                          ? "bg-green-500/15 text-green-400 border-green-500/30 hover:bg-red-500/15 hover:text-red-400 hover:border-red-500/30"
                          : "bg-white/5 text-gray-400 border-white/10 hover:bg-green-500/15 hover:text-green-400 hover:border-green-500/30"
                      } ${isToggling ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {isToggling ? (
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : isParticipated ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        <XCircle size={14} />
                      )}
                      {isParticipated ? "Participated" : "Not Yet"}
                    </button>

                    <div className="text-[10px] font-bold uppercase tracking-widest text-[#BA170D] bg-[#BA170D]/5 px-2 py-1 rounded inline-block">
                      {reg.type} Entry
                    </div>
                    <div className="flex items-center justify-end gap-1.5 text-xs text-gray-600">
                      <Calendar size={12} />
                      {reg.registeredAt
                        ? new Date(
                            reg.registeredAt.seconds * 1000,
                          ).toLocaleDateString()
                        : "-"}
                    </div>
                    {userRole === "admin" && (
                      <button
                        onClick={() =>
                          handleRemoveUser(reg.id, reg.uid, reg.type, reg.name)
                        }
                        className="text-gray-500 hover:text-red-500 transition-colors p-1"
                        title="Remove from Event"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Team Members */}
                {reg.members && reg.members.length > 0 && (
                  <div className="border-t border-white/5 bg-white/[0.02] p-6">
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Users size={12} /> Team Members ({reg.members.length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {reg.members.map((member, i) => (
                        <div
                          key={i}
                          className="flex flex-col p-3 rounded-lg bg-black/40 border border-white/5 hover:border-white/10 transition-colors gap-2 relative group/member"
                        >
                          {userRole === "admin" && (
                            <div className="absolute top-2 right-2 opacity-0 group-hover/member:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveUser(
                                    reg.id,
                                    member.uid,
                                    "team",
                                    member.name,
                                  );
                                }}
                                className="text-gray-600 hover:text-red-500 transition-colors"
                                title="Remove Member"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <p className="text-sm font-bold text-gray-300 truncate">
                                {member.name}
                              </p>
                              <p className="text-[10px] text-gray-500 truncate">
                                {member.email}
                              </p>
                            </div>
                            <span className="text-xs font-mono font-bold text-[#BA170D]">
                              {member.chestNo}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 text-[9px] font-bold uppercase tracking-wide opacity-80">
                            {member.house && member.house !== "-" && (
                              <span
                                className={`px-1.5 py-0.5 rounded border ${getHouseColor(member.house)}`}
                              >
                                {member.house}
                              </span>
                            )}
                            {member.department && member.department !== "-" && (
                              <span className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-gray-400">
                                {member.department}
                              </span>
                            )}
                            {member.semester && member.semester !== "-" && (
                              <span className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-gray-400">
                                {member.semester}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hover accent + participated line */}
                <div
                  className={`absolute bottom-0 left-0 w-full h-0.5 transition-opacity ${isParticipated ? "bg-green-500 opacity-60 group-hover:opacity-100" : "bg-[#BA170D] opacity-0 group-hover:opacity-100"}`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {sortedRegs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 text-center border border-dashed border-white/10 rounded-3xl bg-white/5">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6 text-gray-600">
            <Search size={32} />
          </div>
          <h3 className="text-2xl font-bold text-white font-unbounded mb-2">
            No Registrations Found
          </h3>
          <p className="text-gray-500 max-w-md">
            We couldn&apos;t find any participants matching your search. Adjust
            your filters or wait for new registrations.
          </p>
        </div>
      )}

      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-neutral-900 border border-white/10 rounded-xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white font-unbounded">
                Add User to Event
              </h3>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400">
                  User Email
                </label>
                <input
                  type="email"
                  placeholder="Enter user email..."
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#BA170D] focus:outline-none transition-colors"
                  autoFocus
                  required
                />
                <p className="text-xs text-gray-500">
                  Note: The user must already be logged in to the system.
                </p>
              </div>
              <div className="pt-2 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm font-bold text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingUser || !newUserEmail.trim()}
                  className="px-6 py-2 rounded-lg text-sm font-bold text-white bg-[#BA170D] hover:bg-[#a0140b] shadow-lg shadow-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {addingUser ? "Adding..." : "Add User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Export Options Modal */}
      <ExportOptionsModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExportConfirm}
        allFields={allExportFields}
      />
    </div>
  );
}
