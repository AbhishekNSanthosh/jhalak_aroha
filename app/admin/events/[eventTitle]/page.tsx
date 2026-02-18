"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  DetailedRegistration,
  fetchDetailedEventRegistrations,
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
} from "lucide-react";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";

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
    if (eventTitle) {
      loadData();
    }
  }, [eventTitle]);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchDetailedEventRegistrations(eventTitle);
    setRegistrations(data);
    setLoading(false);
  };

  const handleExport = () => {
    if (registrations.length === 0) return;

    const rows: any[] = [];
    registrations.forEach((reg) => {
      // Main Participant/Leader Row
      rows.push({
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
        "Registered At": reg.registeredAt
          ? new Date(reg.registeredAt.seconds * 1000).toLocaleString()
          : "-",
      });

      // Member Rows
      if (reg.members && reg.members.length > 0) {
        reg.members.forEach((member) => {
          rows.push({
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
            "Registered At": "-",
          });
        });
      }
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    const safeTitle = eventTitle.replace(/[^a-z0-9]/gi, "_").substring(0, 30);
    XLSX.utils.book_append_sheet(wb, ws, "Participants");
    XLSX.writeFile(wb, `jhalak_${safeTitle}_detailed.xlsx`);
    toast.success("Excel exported!");
  };

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
      // Check if main participant matches house
      if (reg.house && reg.house.toLowerCase().includes(houseKey)) return true;

      // Check if any member matches house (if team)
      if (
        reg.members &&
        reg.members.some(
          (m) => m.house && m.house.toLowerCase().includes(houseKey),
        )
      )
        return true;

      return false;
    }

    return true;
  });

  const sortedRegs = [...filteredRegs].sort((a, b) => {
    // If a house is selected, default to grouping by Department then Semester
    if (selectedHouse) {
      const deptCompare = (a.department || "").localeCompare(
        b.department || "",
      );
      if (deptCompare !== 0) return deptCompare;

      const semCompare = (a.semester || "").localeCompare(b.semester || "");
      if (semCompare !== 0) return semCompare;
    }

    if (sortBy === "chestNo") {
      return a.chestNo.localeCompare(b.chestNo, undefined, { numeric: true });
    } else if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    } else if (sortBy === "house") {
      return (a.house || "").localeCompare(b.house || "");
    } else {
      const tA = a.registeredAt?.seconds || 0;
      const tB = b.registeredAt?.seconds || 0;
      return tB - tA;
    }
  });

  const getHouseColor = (house: string) => {
    const normalized = (house || "").toLowerCase();
    if (normalized.includes("red") || normalized.includes("ruby"))
      return "text-red-500 border-red-500/50 bg-red-500/10";
    if (normalized.includes("blue") || normalized.includes("sapphire"))
      return "text-blue-500 border-blue-500/50 bg-blue-500/10";
    if (normalized.includes("green") || normalized.includes("emerald"))
      return "text-green-500 border-green-500/50 bg-green-500/10";
    if (normalized.includes("yellow") || normalized.includes("topaz"))
      return "text-yellow-500 border-yellow-500/50 bg-yellow-500/10";

    return "text-purple-400 border-purple-500/50 bg-purple-500/10";
  };

  const totalParticipants = registrations.reduce(
    (acc, curr) => acc + 1 + (curr.members?.length || 0),
    0,
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white/50 font-unbounded animate-pulse">
        LOADING DATA...
      </div>
    );
  }

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
            <div className="flex items-center gap-4 text-sm text-gray-400 font-mono">
              <span className="flex items-center gap-2">
                <Users size={14} className="text-[#BA170D]" />
                <span className="text-white font-bold">
                  {registrations.length}
                </span>{" "}
                Entries
              </span>
              <span className="w-1 h-1 bg-white/20 rounded-full"></span>
              <span className="flex items-center gap-2">
                <User size={14} className="text-[#BA170D]" />
                <span className="text-white font-bold">
                  {totalParticipants}
                </span>{" "}
                Participants
              </span>
            </div>
          </div>

          <button
            onClick={handleExport}
            disabled={registrations.length === 0}
            className="flex items-center gap-2 bg-white text-black hover:bg-[#BA170D] hover:text-white px-6 py-3 rounded-full transition-all font-bold text-xs uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={16} /> Export Excel
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

        <div className="h-full w-px bg-white/10 hidden md:block"></div>

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
          // Count participants in this house
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
              className={`
                relative p-4 rounded-xl border transition-all duration-300 overflow-hidden group
                ${
                  isSelected
                    ? `${house.color} border-transparent text-white`
                    : "border-white/5 bg-white/5 hover:border-white/20 text-gray-400 group-hover:text-white"
                }
              `}
            >
              {/* Background Glow */}
              <div
                className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity ${house.color}`}
              ></div>

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

              {/* Active Indicator */}
              {isSelected && (
                <div
                  className={`absolute top-0 right-0 w-16 h-16 blur-2xl -mr-8 -mt-8 ${house.color} opacity-20`}
                ></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-4">
        {sortedRegs.map((reg, index) => {
          // Group Header Logic
          const currentGroup = `${reg.department || "Unknown"} - ${reg.semester || "?"}`;
          const prevReg = index > 0 ? sortedRegs[index - 1] : null;
          const prevGroup = prevReg
            ? `${prevReg.department || "Unknown"} - ${prevReg.semester || "?"}`
            : null;
          const showHeader = selectedHouse && currentGroup !== prevGroup;

          return (
            <div key={reg.id} className="contents">
              {showHeader && (
                <div className="mt-8 mb-4 flex items-center gap-4">
                  <div className="h-px flex-1 bg-white/20"></div>
                  <h2 className="text-xl font-black text-white/80 font-unbounded uppercase tracking-wider">
                    {currentGroup}
                  </h2>
                  <div className="h-px flex-1 bg-white/20"></div>
                </div>
              )}

              <div className="group relative bg-[#0A0A0A] hover:bg-[#111] border border-white/5 hover:border-white/20 rounded-2xl overflow-hidden transition-all duration-300">
                <div className="p-6 grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-6 items-center">
                  {/* Chest Number Badge */}
                  <div className="flex flex-col items-center justify-center w-20 h-20 bg-[#BA170D]/10 rounded-xl border border-[#BA170D]/20 group-hover:bg-[#BA170D] group-hover:text-white transition-colors">
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
                      <h3 className="text-xl font-bold text-white group-hover:text-[#BA170D] transition-colors">
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
                        <Mail size={12} /> {reg.email}
                      </div>
                      <div className="flex items-center gap-1.5 hover:text-white transition-colors">
                        <Phone size={12} /> {reg.mobile}
                      </div>
                      <div className="flex items-center gap-1.5 hover:text-white transition-colors">
                        <Hash size={12} /> {reg.collegeId}
                      </div>
                    </div>
                  </div>

                  {/* Meta / Date */}
                  <div className="text-right space-y-2">
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
                  </div>
                </div>

                {/* Team Members List (If applicable) */}
                {reg.members && reg.members.length > 0 && (
                  <div className="border-t border-white/5 bg-white/[0.02] p-6">
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Users size={12} /> Team Members ({reg.members.length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {reg.members.map((member, i) => (
                        <div
                          key={i}
                          className="flex flex-col p-3 rounded-lg bg-black/40 border border-white/5 hover:border-white/10 transition-colors gap-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <p className="text-sm font-bold text-gray-300 truncate">
                                {member.name}
                              </p>
                              <p className="text-[10px] text-gray-500 truncate">
                                {member.email}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-mono font-bold text-[#BA170D]">
                                {member.chestNo}
                              </span>
                            </div>
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

                {/* Hover Accent Line */}
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#BA170D] opacity-0 group-hover:opacity-100 transition-opacity"></div>
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
            We couldn't find any participants matching your search. Adjust your
            filters or wait for new registrations.
          </p>
        </div>
      )}
    </div>
  );
}
