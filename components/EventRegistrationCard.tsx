import { useState, useEffect } from "react";
import { EventItem, TeamRegistration } from "@/data/constant";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Lock, Users, Plus, X, Search, AlertCircle } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import Toast, { ToastType } from "@/components/ui/Toast";

interface EventRegistrationCardProps {
  event: EventItem;
  isSelected: boolean;
  isLocked: boolean; // True if user is a member but not leader
  teamDetails?: TeamRegistration; // If selected/locked, pass details
  onToggle: () => void;
  onCreateTeam: (members: any[]) => Promise<void>; // Pass members array
  onLeaveTeam: () => Promise<void>;
  currentUser: any; // User object from firebase auth
}

export default function EventRegistrationCard({
  event,
  isSelected,
  isLocked,
  teamDetails,
  onToggle,
  onCreateTeam,
  onLeaveTeam,
  currentUser,
}: EventRegistrationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [teamMembers, setTeamMembers] = useState<
    { email: string; uid?: string; name?: string; status?: string }[]
  >([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  // Toast State
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
    isVisible: boolean;
  }>({
    message: "",
    type: "info",
    isVisible: false,
  });

  const showToast = (message: string, type: ToastType = "info") => {
    setToast({ message, type, isVisible: true });
  };

  const isGroup = event.eventType === "group";

  // Debounce Search Effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchEmail) {
        handleSearchUser();
      } else {
        setSearchError(""); // Clear error if empty
      }
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [searchEmail]);

  const handleSearchUser = async () => {
    if (!searchEmail) return;

    // Self-add check
    if (
      currentUser &&
      searchEmail.toLowerCase() === currentUser.email?.toLowerCase()
    ) {
      setSearchError("You are already the team leader.");
      return;
    }

    if (!db) {
      setSearchError("Database not initialized");
      return;
    }
    setSearchLoading(true);
    setSearchError("");

    try {
      const q = query(
        collection(db, "users"),
        where("email", "==", searchEmail),
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setSearchError("User not found. Ask them to register/login first.");
      } else {
        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();

        // Check if already added
        if (teamMembers.some((m) => m.email === userData.email)) {
          setSearchError("User already added to team.");
        } else if (
          currentUser.house &&
          userData.house &&
          currentUser.house !== userData.house
        ) {
          setSearchError(
            `Cannot add member. They are from ${userData.house}, but you are from ${currentUser.house}.`,
          );
        } else {
          setTeamMembers((prev) => [
            ...prev,
            {
              email: userData.email,
              uid: userDoc.id,
              name: userData.name,
              status: "pending",
            },
          ]);
          setSearchEmail(""); // Clear input on success
          showToast("Team member added!", "success");
        }
      }
    } catch (err) {
      console.error(err);
      setSearchError("Error searching user.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSubmitTeam = () => {
    // Validation: Min participants (including current user as leader, so teamMembers.length + 1)
    const total = teamMembers.length + 1;
    const min = event.minParticipants || 1;
    if (total < min) {
      showToast(
        `Minimum ${min} participants required (including you).`,
        "error",
      );
      return;
    }
    onCreateTeam(teamMembers);
  };

  return (
    <motion.div
      layout
      className={`relative border rounded-2xl overflow-hidden transition-all duration-300 ${
        isSelected
          ? "bg-[#BA170D]/10 border-[#BA170D] shadow-[0_0_20px_rgba(186,23,13,0.15)]"
          : "bg-white/5 border-white/10 hover:border-white/20"
      }`}
    >
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
      />
      <div className="p-6 flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {event.tags.map((t) => (
                <span
                  key={t}
                  className="text-[8px] uppercase font-black px-2 py-0.5 bg-white/10 rounded-sm text-gray-400 tracking-[0.2em] border border-white/5"
                >
                  {t}
                </span>
              ))}
            </div>
            <h3 className="text-lg md:text-xl font-black font-unbounded text-white tracking-tighter leading-tight">
              {event.title}
            </h3>
            <p className="text-[11px] text-gray-500 mt-2 line-clamp-2 font-medium tracking-wide uppercase leading-relaxed">
              {event.description}
            </p>
          </div>

          {isLocked ? (
            <div
              className="p-2 bg-white/10 rounded-full text-gray-400"
              title="Registered by Team Leader"
            >
              <Lock size={20} />
            </div>
          ) : (
            <button
              onClick={() =>
                isGroup ? setIsExpanded(!isExpanded) : onToggle()
              }
              className={`p-2 rounded-full transition-colors ${
                isSelected
                  ? "bg-[#BA170D] text-white"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {isSelected ? <Check size={20} /> : <Plus size={20} />}
            </button>
          )}
        </div>

        {/* Team Details / Constraints Display */}
        <div className="flex gap-4 text-xs text-gray-500 font-mono">
          {isGroup && (
            <span className="flex items-center gap-1">
              <Users size={12} />
              {event.minParticipants}-{event.maxParticipants} Members
            </span>
          )}
        </div>

        {/* Group Registration Area */}
        <AnimatePresence>
          {isGroup && (isExpanded || isSelected) && !isLocked && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="pt-4 border-t border-white/10 space-y-4"
            >
              {isSelected ? (
                // View Team State
                <div>
                  <h4 className="text-sm font-bold text-[#BA170D] mb-2">
                    Your Team
                  </h4>
                  <ul className="space-y-2 mb-4">
                    <li className="text-sm text-white flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#BA170D] flex items-center justify-center text-white text-xs font-bold">
                        L
                      </div>
                      You (Leader)
                    </li>
                    {teamDetails?.members
                      .filter((m) => m.role !== "leader")
                      .map((m, i) => (
                        <li
                          key={i}
                          className="text-sm text-gray-300 flex items-center gap-2"
                        >
                          <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs">
                            M
                          </div>
                          {m.name}{" "}
                          <span className="text-xs text-gray-500">
                            ({m.email})
                          </span>
                        </li>
                      ))}
                  </ul>
                  <button
                    onClick={onLeaveTeam}
                    className="text-xs text-red-500 hover:text-red-400 underline"
                  >
                    Disband Team & Unregister
                  </button>
                </div>
              ) : (
                // Create Team State
                <div>
                  <h4 className="text-sm font-bold text-white mb-3">
                    Build Your Team
                  </h4>

                  {/* Info Message */}
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4">
                    <p className="text-xs text-blue-300 mb-2 flex items-center gap-2">
                      <AlertCircle size={14} />
                      <span className="font-semibold">
                        Team members must have an account first!
                      </span>
                    </p>
                    <p className="text-xs text-gray-400 leading-relaxed mb-3">
                      Ask your team members to create an account before adding
                      them to your team.
                    </p>

                    {/* Signup URL with Copy Button */}
                    <div className="flex items-center gap-2 bg-black/30 rounded-lg p-2 border border-white/10">
                      <a
                        href="/signup"
                        target="_blank"
                        className="text-[#BA170D] hover:underline font-mono text-xs flex-1 truncate"
                      >
                        {typeof window !== "undefined"
                          ? window.location.origin
                          : ""}
                        /signup
                      </a>
                      <button
                        onClick={() => {
                          const url = `${typeof window !== "undefined" ? window.location.origin : ""}/signup`;
                          navigator.clipboard.writeText(url);
                          showToast(
                            "Signup link copied to clipboard!",
                            "success",
                          );
                        }}
                        className="px-3 py-1.5 bg-[#BA170D]/20 hover:bg-[#BA170D]/30 text-[#BA170D] rounded text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap border border-[#BA170D]/30"
                        title="Copy signup link"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect
                            x="9"
                            y="9"
                            width="13"
                            height="13"
                            rx="2"
                            ry="2"
                          ></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        Copy Link
                      </button>
                    </div>
                  </div>

                  {/* Team Size Info */}
                  <div className="flex items-center justify-between mb-3 text-xs">
                    <span className="text-gray-400">
                      Team Size:{" "}
                      <span className="text-white font-bold">
                        {teamMembers.length + 1}
                      </span>{" "}
                      / {event.maxParticipants || "∞"}
                    </span>
                    {event.minParticipants && (
                      <span className="text-gray-500">
                        Min: {event.minParticipants} members
                      </span>
                    )}
                  </div>

                  {/* Member Input */}
                  <div className="mb-2">
                    <div className="flex gap-2 relative">
                      <input
                        type="email"
                        placeholder="Enter member's email address"
                        className={`flex-1 bg-black/20 border ${searchError ? "border-red-500" : "border-white/10"} rounded-lg px-3 py-2 text-sm text-white focus:border-[#BA170D] outline-hidden placeholder:text-gray-600`}
                        value={searchEmail}
                        onChange={(e) => setSearchEmail(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSearchUser();
                          }
                        }}
                      />
                      <button
                        onClick={handleSearchUser}
                        disabled={!searchEmail || searchLoading}
                        className="px-4 py-2 bg-[#BA170D] hover:bg-[#A00000] disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold text-sm rounded-lg transition-all flex items-center gap-2 whitespace-nowrap"
                      >
                        {searchLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Searching...
                          </>
                        ) : (
                          <>
                            <Plus size={16} />
                            Add Member
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 ml-1">
                      Press Enter or click "Add Member" to add each team member
                    </p>
                  </div>
                  {searchError && (
                    <p className="text-xs text-red-500 mb-2 flex items-center gap-1">
                      <AlertCircle size={10} /> {searchError}
                    </p>
                  )}

                  {/* Added Members List */}
                  {teamMembers.length > 0 && (
                    <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-2">
                        Team Members ({teamMembers.length})
                      </p>
                      {teamMembers.map((m, idx) => (
                        <div
                          key={m.email}
                          className="flex justify-between items-center text-sm bg-white/5 px-3 py-2 rounded-lg border border-white/10"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#BA170D]/20 flex items-center justify-center text-[#BA170D] text-xs font-bold">
                              {idx + 1}
                            </div>
                            <div>
                              <p className="text-white font-medium">
                                {m.name || m.email}
                              </p>
                              {m.name && (
                                <p className="text-xs text-gray-500">
                                  {m.email}
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              setTeamMembers(
                                teamMembers.filter(
                                  (tm) => tm.email !== m.email,
                                ),
                              )
                            }
                            className="p-1 hover:bg-red-500/20 rounded transition-colors"
                          >
                            <X
                              size={16}
                              className="text-gray-500 hover:text-red-400"
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={handleSubmitTeam}
                    disabled={teamMembers.length === 0}
                    className="w-full py-3 bg-[#BA170D] text-white font-bold text-sm rounded-lg hover:bg-[#A00000] disabled:bg-gray-600 disabled:cursor-not-allowed transition-all"
                  >
                    Confirm Team Registration
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
