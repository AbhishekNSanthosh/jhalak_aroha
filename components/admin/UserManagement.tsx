"use client";

import { useEffect, useState } from "react";
import { AdminUserView, fetchAllUsersWithData } from "@/lib/adminService";
import { Search, Download, Shield, User as UserIcon } from "lucide-react";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import ConfirmToast from "@/components/ConfirmToast";
import { Trash2, AlertTriangle, Wrench } from "lucide-react";

import Toast, { ToastType } from "@/components/ui/Toast";

export default function UserManagement() {
  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<
    "all" | "admin" | "user" | "organizer"
  >("all"); // Add organizer type

  // Toast State
  const [uiToast, setUiToast] = useState<{
    message: string;
    type: ToastType;
    isVisible: boolean;
  }>({
    message: "",
    type: "info",
    isVisible: false,
  });

  const showToast = (message: string, type: ToastType = "info") => {
    setUiToast({ message, type, isVisible: true });
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchAllUsersWithData();
    setUsers(data);
    setLoading(false);
  };

  const handleExport = () => {
    // Flatten data for export
    const exportData = users.map((u) => ({
      Name: u.name,
      CollegeID: u.collegeId || "N/A",
      Email: u.email,
      Role: u.role || "user",
      Mobile: u.mobile || "N/A",
      Department: u.department || "N/A",
      Semester: u.semester || "N/A",
      House: u.house || "N/A",
      RegistrationCount: u.registrationCount,
      Events: u.events.join(", "),
      ChestNumbers: u.chestNumbers.join(", "),
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    XLSX.writeFile(wb, "jhalak_users_export.xlsx");
    showToast("Excel exported successfully!", "success");
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      (user.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (user.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (user.mobile && user.mobile.includes(searchTerm));

    const matchesRole =
      roleFilter === "all" || (user.role || "user") === roleFilter;

    return matchesSearch && matchesRole;
  });

  if (loading)
    return (
      <div className="text-white text-center py-20 animate-pulse font-unbounded">
        LOADING USER DATA...
      </div>
    );

  const handleUpdateRole = async (uid: string, newRole: string) => {
    // Optimistic update
    setUsers((prev) =>
      prev.map((u) => (u.uid === uid ? { ...u, role: newRole as any } : u)),
    );

    // Call API
    try {
      const { updateUserRole } = await import("@/lib/adminService");
      const result = await updateUserRole(uid, newRole);
      if (!result.success) {
        showToast(result.message || "Failed to update role", "error");
        loadData(); // Revert on failure
      } else {
        showToast(`Role updated to ${newRole}`, "success");
      }
    } catch (error) {
      console.error(error);
      showToast("Failed to update role", "error");
      loadData();
    }
  };

  const handleCleanUser = async (uid: string, name: string) => {
    const eventTitle = prompt(
      `Enter Event Title to force-remove from ${name}'s data (e.g., MIME):`,
    );
    if (!eventTitle) return;

    if (
      !confirm(
        `Are you sure you want to remove "${eventTitle}" from ${name}? This is a destructive data fix.`,
      )
    )
      return;

    try {
      const { cleanUserRegistration } = await import("@/lib/adminService");
      const res = await cleanUserRegistration(uid, eventTitle);
      if (res.success) {
        showToast(res.message || "Fixed!", "success");
        loadData();
      } else {
        showToast(res.message || "Failed", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Error", "error");
    }
  };

  const handleDeleteUser = (uid: string, name: string) => {
    toast.custom((t) => (
      <ConfirmToast
        t={t}
        message={`Are you sure you want to delete user "${name}"? This action cannot be undone.`}
        onConfirm={async () => {
          setLoading(true);
          const { deleteUser } = await import("@/lib/adminService");
          const result = await deleteUser(uid);
          if (result.success) {
            showToast("User deleted successfully", "success");
            loadData();
          } else {
            showToast(result.message || "Failed to delete user", "error");
            setLoading(false);
          }
        }}
      />
    ));
  };

  const handleDeleteAllUsers = () => {
    toast.custom((t) => (
      <ConfirmToast
        t={t}
        message="DANGER: Are you sure you want to DELETE ALL USERS? This will wipe all registration data and cannot be undone!"
        onConfirm={async () => {
          setLoading(true);
          const { deleteAllUsers } = await import("@/lib/adminService");
          const result = await deleteAllUsers();
          if (result.success) {
            showToast("All users deleted successfully", "success");
            loadData();
          } else {
            showToast(result.message || "Failed to delete users", "error");
            setLoading(false);
          }
        }}
      />
    ));
  };

  return (
    <div className="space-y-6">
      <Toast
        message={uiToast.message}
        type={uiToast.type}
        isVisible={uiToast.isVisible}
        onClose={() => setUiToast((prev) => ({ ...prev, isVisible: false }))}
      />
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
        <div className="relative w-full md:w-96">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by name, email, or mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:border-[#BA170D] focus:outline-none transition-colors"
          />
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#BA170D] focus:outline-none"
          >
            <option value="all">All Roles</option>
            <option value="user">Users</option>
            <option value="admin">Admins</option>
            <option value="organizer">Organizers</option>
          </select>

          <button
            onClick={handleDeleteAllUsers}
            className="flex items-center gap-2 bg-red-900/50 hover:bg-red-900 text-red-200 px-4 py-2 rounded-lg transition-colors border border-red-800"
            title="Delete All Users"
          >
            <AlertTriangle size={18} />
            <span className="hidden md:inline text-xs font-bold uppercase">
              Delete All
            </span>
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-[#BA170D] text-white font-bold px-4 py-2 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <Download size={18} />
            <span className="hidden md:inline">Export Excel</span>
            <span className="md:hidden">Export</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left border-collapse">
          <thead className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider font-bold">
            <tr>
              <th className="p-4">User</th>
              <th className="p-4">ID</th>
              <th className="p-4">Chest No</th>
              <th className="p-4">Details</th>
              <th className="p-4">Contact</th>
              <th className="p-4 text-center">Events</th>
              <th className="p-4 text-right">Role</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 text-sm">
            {filteredUsers.map((user) => (
              <tr
                key={user.uid}
                className="hover:bg-white/5 transition-colors group"
              >
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[#BA170D] font-bold overflow-hidden">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        (user.name || "?").charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-white group-hover:text-[#BA170D] transition-colors">
                        {user.name}
                      </p>
                      <p className="text-gray-500 text-xs">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 font-mono text-xs text-[#BA170D] font-bold">
                  {user.collegeId || "-"}
                </td>
                <td className="p-4">
                  {user.chestNo ? (
                    <span className="bg-[#BA170D]/20 text-[#BA170D] px-3 py-1 rounded-full text-xs font-bold font-mono border border-[#BA170D]/30">
                      {user.chestNo}
                    </span>
                  ) : user.chestNumbers && user.chestNumbers.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {user.chestNumbers.slice(0, 2).map((cn, idx) => (
                        <span
                          key={idx}
                          className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded text-[10px] font-mono border border-gray-700 w-fit"
                        >
                          {cn}
                        </span>
                      ))}
                      {user.chestNumbers.length > 2 && (
                        <span className="text-[10px] text-gray-500">
                          +{user.chestNumbers.length - 2} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-600">-</span>
                  )}
                </td>
                <td className="p-4">
                  <div className="flex flex-col gap-1 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <span className="w-1 h-1 bg-[#BA170D] rounded-full"></span>{" "}
                      {user.department || "No Dept"}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1 h-1 bg-blue-500 rounded-full"></span>{" "}
                      {user.semester || "No Sem"}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-500 rounded-full"></span>{" "}
                      {user.house || "No House"}
                    </span>
                  </div>
                </td>
                <td className="p-4 text-gray-300 font-mono text-xs">
                  {user.mobile || "-"}
                </td>
                <td className="p-4 text-center">
                  <span className="bg-white/10 px-2 py-1 rounded text-xs font-bold text-white">
                    {user.registrationCount}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <select
                    value={user.role || "user"}
                    onChange={(e) => handleUpdateRole(user.uid, e.target.value)}
                    className={`bg-transparent border rounded px-2 py-1 text-xs font-bold focus:outline-none focus:border-white/50 cursor-pointer ${
                      user.role === "admin"
                        ? "text-[#BA170D] border-[#BA170D]/30"
                        : "text-gray-400 border-white/10"
                    }`}
                  >
                    <option value="user" className="text-black">
                      USER
                    </option>
                    <option value="admin" className="text-black">
                      ADMIN
                    </option>
                    <option value="organizer" className="text-black">
                      ORGANIZER
                    </option>
                  </select>
                </td>
                <td className="p-4 text-center">
                  <button
                    onClick={() => handleCleanUser(user.uid, user.name)}
                    className="p-2 text-gray-500 hover:text-yellow-500 hover:bg-yellow-500/10 rounded-lg transition-colors mr-2"
                    title="Fix Data (Force Remove Event)"
                  >
                    <Wrench size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.uid, user.name)}
                    className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Delete User"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="p-10 text-center text-gray-500">
            No users found matching your search.
          </div>
        )}
      </div>

      <div className="text-right text-xs text-gray-600">
        Total Users: {users.length}
      </div>
    </div>
  );
}
