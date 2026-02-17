import { useState, useEffect } from "react";
import { EventItem, TeamRegistration } from "@/data/constant";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Lock,
  Users,
  Plus,
  X,
  Search,
  AlertCircle,
  Info,
  HelpCircle,
  Clock,
  User,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import Toast, { ToastType } from "@/components/ui/Toast";
import {
  fetchUserRegistrations,
  validateRegistrationRules,
} from "@/lib/registrationService";

interface EventRegistrationCardProps {
  event: EventItem;
  isSelected: boolean;
  isLocked?: boolean;
  teamDetails?: TeamRegistration;
  onToggle: () => void;
  onCreateTeam: (members: any[]) => void;
  onLeaveTeam: () => void;
  currentUser: any;
  isRegistrationClosed?: boolean;
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
  isRegistrationClosed = false,
}: EventRegistrationCardProps) {
  const [isExpanded, setIsExpanded] = useState(isSelected && !!teamDetails);
  const [teamMembers, setTeamMembers] = useState<any[]>(
    teamDetails?.members || [],
  );
  const [searchEmail, setSearchEmail] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [showRules, setShowRules] = useState(false);

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
    if (!searchEmail || searchLoading) return;

    // Self-add check
    if (
      currentUser &&
      searchEmail.toLowerCase() === currentUser.email?.toLowerCase()
    ) {
      setSearchError("You are already the team leader.");
      return;
    }

    // Check if already in team (local check)
    if (
      teamMembers.some(
        (m) => m.email.toLowerCase() === searchEmail.toLowerCase(),
      )
    ) {
      setSearchError("User already added to team.");
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

        // Check if self (by UID)
        if (userDoc.id === currentUser.uid) {
          setSearchError("You are already the team leader.");
          return;
        }

        // Check if already added
        if (teamMembers.some((m) => m.email === userData.email)) {
          setSearchError("User already added to team.");
        } else {
          // Strict House Check
          const leaderHouse = currentUser?.house;
          const memberHouse = userData?.house;

          if (!leaderHouse) {
            setSearchError(
              "You are not assigned to a house. Please contact admin.",
            );
          } else if (!memberHouse) {
            setSearchError("This user is not assigned to a house.");
          } else if (leaderHouse.toLowerCase() !== memberHouse.toLowerCase()) {
            setSearchError(
              `Cannot add member. They are from ${memberHouse}, but you are from ${leaderHouse}.`,
            );
          } else {
            // Continue to Check registration limits...
            // Check registration limits
            try {
              const registrations = await fetchUserRegistrations(userDoc.id);
              // Check if adding this event is valid for them
              const validation = validateRegistrationRules(
                registrations.soloEvents,
                registrations.teamEvents,
                null, // use existing solo
                event.title, // new team event
              );

              if (!validation.valid) {
                setSearchError(`Limit reached: ${validation.message}`);
                return;
              }

              setTeamMembers((prev) => {
                if (prev.some((m) => m.uid === userDoc.id)) return prev;
                return [
                  ...prev,
                  {
                    email: userData.email,
                    uid: userDoc.id,
                    name: userData.name,
                    status: "pending",
                  },
                ];
              });
              setSearchEmail(""); // Clear input on success
              showToast("Team member added!", "success");
            } catch (err) {
              console.error("Validation error", err);
              setSearchError("Could not validate user limits. Try again.");
            }
          }
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
      className={`relative group bg-[#111] border rounded-2xl p-4 transition-all duration-300 hover:border-[#BA170D]/40 hover:shadow-2xl hover:shadow-[#BA170D]/5 ${
        isSelected
          ? "border-[#BA170D] bg-[#BA170D]/5"
          : isRegistrationClosed
            ? "border-white/5 opacity-60 grayscale-[0.8]"
            : "border-white/10"
      }`}
    >
      {/* Modern Overlay for Closed State */}
      {isRegistrationClosed && !isSelected && (
        <div className="absolute inset-x-0 -top-2 flex justify-center z-20 pointer-events-none">
          <div className="px-3 py-1 bg-black border border-white/10 rounded-full shadow-xl flex items-center gap-1.5 backdrop-blur-md">
            <Lock size={10} className="text-red-500" />
            <span className="text-[9px] font-black text-white uppercase tracking-[0.15em]">
              Entries Locked
            </span>
          </div>
        </div>
      )}

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

            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowRules(true);
              }}
              className="mt-3 flex items-center gap-1 text-[10px] uppercase font-bold text-gray-400 hover:text-white transition-colors"
              title="View Rules"
            >
              <Info size={12} /> View Rules & Regulations
            </button>
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
              onClick={() => {
                if (isRegistrationClosed && !isSelected) {
                  showToast("Registration is closed for this event.", "info");
                  return;
                }
                isGroup ? setIsExpanded(!isExpanded) : onToggle();
              }}
              disabled={isRegistrationClosed && !isSelected}
              className={`p-2 rounded-full transition-colors ${
                isSelected
                  ? "bg-[#BA170D] text-white"
                  : isRegistrationClosed
                    ? "bg-white/5 text-gray-600 cursor-not-allowed"
                    : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {isSelected ? (
                <Check size={20} />
              ) : isRegistrationClosed ? (
                <Lock size={20} />
              ) : (
                <Plus size={20} />
              )}
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
          {isGroup && (isExpanded || isSelected) && (
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
                  <div className="space-y-2 mb-4">
                    {/* Leader */}
                    {(() => {
                      const leader = teamDetails?.members.find(
                        (m) => m.role === "leader",
                      );
                      const isMe = leader?.uid === currentUser.uid;
                      return (
                        <div className="group/member flex justify-between items-center text-sm bg-white/5 pl-3 pr-2 py-2.5 rounded-lg border border-[#BA170D]/30 hover:bg-white/10 transition-colors">
                          <div className="flex items-center gap-3 overflow-hidden min-w-0">
                            <div className="shrink-0 w-8 h-8 rounded-full bg-[#BA170D] flex items-center justify-center text-white text-xs font-bold ring-1 ring-[#BA170D]/50 shadow-[0_0_10px_rgba(186,23,13,0.3)]">
                              L
                            </div>
                            <div className="flex flex-col min-w-0 overflow-hidden">
                              <p className="text-white font-bold truncate leading-tight">
                                {isMe
                                  ? "You (Leader)"
                                  : `${leader?.name || "Leader"} (Leader)`}
                              </p>
                              <div className="w-full overflow-hidden relative h-4 mt-0.5">
                                <p
                                  className="text-xs text-gray-400 font-mono whitespace-nowrap absolute left-0 top-0 transition-transform duration-[3000ms] ease-linear group-hover/member:-translate-x-[30%]"
                                  title={leader?.email}
                                >
                                  {leader?.email}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Other Members */}
                    {teamDetails?.members
                      .filter((m) => m.role === "member")
                      .map((m, i) => (
                        <div
                          key={i}
                          className="group/member flex justify-between items-center text-sm bg-white/5 pl-3 pr-2 py-2.5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                        >
                          <div className="flex items-center gap-3 overflow-hidden min-w-0">
                            <div className="shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white text-xs font-bold ring-1 ring-white/10">
                              {m.uid === currentUser.uid ? "Y" : "M"}
                            </div>
                            <div className="flex flex-col min-w-0 overflow-hidden">
                              <p
                                className="text-white font-bold truncate leading-tight"
                                title={m.name}
                              >
                                {m.uid === currentUser.uid ? "You" : m.name}
                              </p>
                              <div className="w-full overflow-hidden relative h-4 mt-0.5">
                                <p
                                  className="text-xs text-gray-400 font-mono whitespace-nowrap absolute left-0 top-0 transition-transform duration-[3000ms] ease-linear group-hover/member:-translate-x-[30%]"
                                  title={m.email}
                                >
                                  {m.email}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
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
                        href="/login"
                        target="_blank"
                        className="text-[#BA170D] hover:underline font-mono text-xs flex-1 truncate"
                      >
                        {typeof window !== "undefined"
                          ? window.location.origin
                          : ""}
                        /login
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
                          className="group/member flex justify-between items-center text-sm bg-white/5 pl-3 pr-2 py-2.5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                        >
                          <div className="flex items-center gap-3 overflow-hidden min-w-0">
                            <div className="shrink-0 w-8 h-8 rounded-full bg-[#BA170D]/20 flex items-center justify-center text-[#BA170D] text-xs font-bold ring-1 ring-[#BA170D]/30">
                              {idx + 1}
                            </div>
                            <div className="flex flex-col min-w-0 overflow-hidden">
                              <p
                                className="text-white font-bold truncate leading-tight"
                                title={m.name || m.email}
                              >
                                {m.name || m.email}
                              </p>
                              {m.name && (
                                <div className="w-full overflow-hidden relative h-4 mt-0.5">
                                  <p
                                    className="text-xs text-gray-400 font-mono whitespace-nowrap absolute left-0 top-0 transition-transform duration-[3000ms] ease-linear group-hover/member:-translate-x-[30%]"
                                    title={m.email}
                                  >
                                    {m.email}
                                  </p>
                                </div>
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
                            className="p-1.5 ml-2 hover:bg-red-500/20 text-gray-500 hover:text-red-400 rounded-md transition-colors shrink-0"
                            title="Remove member"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={handleSubmitTeam}
                    disabled={teamMembers.length === 0 || isRegistrationClosed}
                    className="w-full py-3 bg-[#BA170D] text-white font-bold text-sm rounded-lg hover:bg-[#A00000] disabled:bg-gray-600 disabled:cursor-not-allowed transition-all"
                  >
                    {isRegistrationClosed
                      ? "Registration Closed"
                      : "Confirm Team Registration"}
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Rules Modal */}
      <AnimatePresence>
        {showRules && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowRules(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-start shrink-0">
                <div>
                  <h3 className="text-xl font-black font-unbounded text-white uppercase">
                    {event.title}
                  </h3>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">
                    Rules & Regulations
                  </p>
                </div>
                <button
                  onClick={() => setShowRules(false)}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar grow">
                {event.timeLimit && (
                  <div className="mb-6 bg-white/5 p-4 rounded-lg border border-white/5">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                      Time Limit
                    </h4>
                    <p className="text-white font-mono text-sm">
                      {event.timeLimit}
                    </p>
                  </div>
                )}

                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                  General Rules
                </h4>
                <ul className="space-y-3">
                  {event.rules.map((rule, idx) => (
                    <li key={idx} className="flex gap-3 text-sm text-gray-300">
                      <span className="text-[#BA170D] font-bold">•</span>
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 border-t border-white/10 bg-white/5 text-center shrink-0">
                <button
                  onClick={() => setShowRules(false)}
                  className="bg-white text-black px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
