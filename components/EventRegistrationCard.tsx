import { useState, useEffect } from "react";
import { EventItem, TeamRegistration } from "@/data/constant";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Lock,
    Users,
    X,
  AlertCircle,
    Info,
  Clock,
    ArrowUpRight,
    UserPlus2,
    Sparkles,
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

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
        if (searchEmail) handleSearchUser();
        else setSearchError("");
    }, 1000);
    return () => clearTimeout(delayDebounceFn);
  }, [searchEmail]);

  const handleSearchUser = async () => {
    if (!searchEmail || searchLoading) return;
      if (currentUser && searchEmail.toLowerCase() === currentUser.email?.toLowerCase()) {
          setSearchError("Leader already registered.");
      return;
    }
      if (teamMembers.some((m) => m.email.toLowerCase() === searchEmail.toLowerCase())) {
          setSearchError("User already added.");
      return;
    }
      if (!db) return;
    setSearchLoading(true);
    setSearchError("");

    try {
        const q = query(collection(db, "users"), where("email", "==", searchEmail));
        const snapshot = await getDocs(q);
      if (snapshot.empty) {
          setSearchError("User not found.");
      } else {
        const userDoc = snapshot.docs[0];
          const userData = userDoc.data();
          const leaderHouse = currentUser?.house;
          const memberHouse = userData?.house;

          if (leaderHouse?.toLowerCase() !== memberHouse?.toLowerCase()) {
              setSearchError(`House Mismatch: ${memberHouse}`);
          } else {
            const registrations = await fetchUserRegistrations(userDoc.id);
            const validation = validateRegistrationRules(registrations.soloEvents, registrations.teamEvents, null, event.title);
            if (!validation.valid) {
              setSearchError(validation.message || "Limit reached");
              return;
          }
            setTeamMembers([...teamMembers, { email: userData.email, uid: userDoc.id, name: userData.name, status: "pending" }]);
            setSearchEmail("");
            showToast("Member staged.", "success");
        }
      }
    } catch (err) {
        setSearchError("Network failure.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSubmitTeam = () => {
      if ((teamMembers.length + 1) < (event.minParticipants || 1)) {
          showToast(`Min ${event.minParticipants} members required.`, "error");
      return;
    }
    onCreateTeam(teamMembers);
  };

  return (
    <motion.div
      layout
          className={`relative group h-full flex flex-col rounded-4xl transition-all duration-700 overflow-hidden ${isSelected 
          ? "border-[#BA170D] shadow-[0_0_60px_rgba(186,23,13,0.15)]"
          : "border-white/10"
      }`}
    >
          <div className="absolute inset-0 bg-black" />
          <div className={`absolute inset-0 transition-all duration-1000 ${isSelected ? "opacity-[0.12]" : "opacity-[0.05] group-hover:opacity-[0.08]"
              } bg-linear-to-br ${event.gradient}`} />
          <div className="absolute inset-0 opacity-[0.3] mix-blend-soft-light pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
      />

          <div className={`relative flex-1 flex flex-col border rounded-4xl transition-all duration-500 backdrop-blur-2xl ${isSelected ? "bg-black/60 border-[#BA170D]/50" : "bg-white/3 border-white/10 group-hover:border-white/20"
              }`}>

              <div className="flex justify-between items-center p-6 pb-0">
                  <div className="flex gap-2.5">
                      {event.date && (
                          <span className="flex items-center gap-1.5 px-3 py-1 bg-[#BA170D]/10 border border-[#BA170D]/30 rounded-lg text-[10px] font-black text-white uppercase tracking-[0.15em] shadow-2xl">
                              <Clock size={11} className="text-[#BA170D]" /> {event.date}
                          </span>
                      )}
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black text-gray-200 uppercase tracking-widest">
                          {isGroup ? <Users size={11} className="text-white" /> : <Sparkles size={11} className="text-white" />} {event.eventType}
                      </span>
                  </div>
                  <button
                      onClick={() => setShowRules(true)}
                      className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10"
                  >
                      <Info size={16} className="text-gray-300" />
                  </button>
              </div>

              <div className="p-8 pt-5 flex flex-col gap-6 h-full">
                  <div className="space-y-4">
                      <h3 className="text-2xl font-black font-unbounded text-white tracking-tighter leading-[0.9] group-hover:text-[#BA170D] transition-colors duration-500 uppercase">
                          {event.title.split(' ').map((word, i) => (
                              <span key={i} className="block">{word}</span>
                          ))}
            </h3>
                      <p className="text-xs text-gray-300 font-semibold leading-relaxed line-clamp-2 min-h-10 tracking-tight">
              {event.description}
            </p>
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-4 pt-4">
                      <div className="flex items-center gap-4">
                          {event.tags.slice(0, 1).map(t => (
                              <div key={t} className="flex flex-col">
                                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tag</span>
                                  <span className="text-[11px] font-black text-white uppercase">{t}</span>
                              </div>
                          ))}
                      </div>

                      <div className="flex items-center gap-2">
                          {isLocked ? (
                              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-gray-400">
                                  <Lock size={20} />
                              </div>
                          ) : (
                              <button
                                  onClick={() => {
                                          if (isRegistrationClosed && !isSelected) return;
                                          isGroup ? setIsExpanded(!isExpanded) : onToggle();
                                      }}
                                      className={`group/btn relative flex items-center gap-3 px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all duration-500 overflow-hidden shadow-2xl ${isSelected
                                              ? "bg-[#BA170D] text-white" 
                                              : "bg-white text-black hover:bg-[#BA170D] hover:text-white"
                                          }`}
                                  >
                                      <span className="relative z-10 flex items-center gap-2">
                                          {isSelected ? (
                                              <><Check size={18} className="stroke-[4]" /> Entry Saved</>
                                          ) : (
                                              <>Register <ArrowUpRight size={18} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" /></>
                                          )}
                                      </span>
                                      <div className="absolute inset-0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000 bg-linear-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
                              </button>
                          )}
                      </div>
                  </div>

                  <AnimatePresence>
                      {isGroup && (isExpanded || isSelected) && (
                          <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="pt-8 border-t border-white/10 space-y-8"
                          >
                              {isSelected ? (
                                  <div className="space-y-6">
                                      <div className="flex items-center justify-between px-1">
                                          <span className="text-[11px] font-black text-[#BA170D] uppercase tracking-[0.3em]">Team Roster</span>
                                          <div className="flex items-center gap-2">
                                              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                              <span className="text-[10px] font-black text-white uppercase">Confirmed</span>
                                          </div>
                                      </div>
                                      <div className="grid grid-cols-1 gap-3">
                                          {teamDetails?.members.map((m, i) => (
                                              <div key={i} className={`flex items-center justify-between p-4 rounded-3xl border transition-all ${m.role === 'leader' ? 'bg-[#BA170D]/10 border-[#BA170D]/40' : 'bg-white/5 border-white/10'}`}>
                                                  <div className="flex items-center gap-4 min-w-0">
                                                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-black shrink-0 ${m.role === 'leader' ? 'bg-[#BA170D] text-white' : 'bg-white/10 text-gray-200'}`}>
                                                          {m.role === 'leader' ? 'L' : 'M'}
                                   </div>
                                   <div className="min-w-0">
                                       <p className="text-xs font-black text-white truncate">{m.uid === currentUser.uid ? "You" : m.name}</p>
                                       <p className="text-[10px] text-gray-400 font-mono truncate tracking-tight">{m.email}</p>
                                   </div>
                               </div>
                           </div>
                       ))}
                                      </div>
                                      <button onClick={onLeaveTeam} className="w-full py-4 text-[10px] font-black text-gray-400 hover:text-red-500 uppercase tracking-[0.3em] transition-all border border-white/10 rounded-2xl hover:bg-red-500/10">
                                          Leave/Disband Team
                                      </button>
                                  </div>
                              ) : (
                                      <div className="space-y-8">
                                          <div className="space-y-3">
                                              <span className="text-[11px] font-black text-white uppercase tracking-[0.3em] pl-1">Add Teammates</span>
                                              <div className="relative group/input">
                                                  <input
                                                      type="email"
                                                      placeholder="Search email..."
                                                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white outline-hidden placeholder:text-gray-600 font-bold focus:border-[#BA170D]"
                                                      value={searchEmail}
                                                      onChange={(e) => setSearchEmail(e.target.value)}
                                                  />
                                                  <button
                                                      onClick={handleSearchUser}
                                                      disabled={!searchEmail || searchLoading}
                                                      className="absolute right-2 top-2 bottom-2 px-6 bg-white text-black rounded-xl font-black text-[11px] uppercase hover:bg-[#BA170D] hover:text-white transition-all disabled:opacity-20 shadow-xl"
                                                  >
                                                      {searchLoading ? "••" : <UserPlus2 size={20} />}
                                                  </button>
                                              </div>
                                              {searchError && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest pl-2 pt-1 flex items-center gap-1.5"><AlertCircle size={14} /> {searchError}</p>}
                                          </div>

                                          {teamMembers.length > 0 && (
                                              <div className="space-y-3 pr-1">
                                                  {teamMembers.map((m, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-3xl">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-[10px] font-black text-gray-100">{idx + 2}</div>
                                    <span className="text-xs font-black text-white truncate max-w-[150px] uppercase">{m.name || m.email}</span>
                                </div>
                                <button onClick={() => setTeamMembers(teamMembers.filter(tm => tm.email !== m.email))} className="p-2.5 text-gray-300 hover:text-red-500 transition-all rounded-full hover:bg-red-500/10"><X size={20} /></button>
                            </div>
                        ))}
                                              </div>
                                          )}

                                          <button
                                              onClick={handleSubmitTeam}
                                              disabled={teamMembers.length === 0}
                                              className="w-full py-5 bg-[#BA170D] text-white font-black text-xs uppercase tracking-[0.4em] rounded-3xl hover:shadow-[0_20px_80px_rgba(186,23,13,0.3)] disabled:opacity-30 disabled:grayscale transition-all hover:scale-[1.02] active:scale-100"
                                          >
                                          Confirm Registration
                                      </button>
                                  </div>
                              )}
                          </motion.div>
                      )}
                  </AnimatePresence>
              </div>
      </div>

      <AnimatePresence>
        {showRules && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl" onClick={() => setShowRules(false)}>
            <motion.div
                          initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.95, opacity: 0 }}
                          className="bg-[#050505] border border-white/10 rounded-[2rem] w-full max-w-md overflow-hidden flex flex-col shadow-2xl max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
                          <div className="p-6 md:p-8 border-b border-white/10 flex justify-between items-center relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-64 h-64 bg-[#BA170D] blur-[120px] opacity-[0.1]" />
                              <div className="relative z-10">
                                  <h3 className="text-xl md:text-2xl font-black font-unbounded text-white uppercase tracking-tighter leading-tight">{event.title}</h3>
                                  <p className="text-[#BA170D] text-[10px] font-black uppercase tracking-[0.4em] mt-2">The Guidelines</p>
                              </div>
                              <button onClick={() => setShowRules(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10 text-white"><X size={20} /></button>
                          </div>
                          <div className="p-6 md:p-8 overflow-y-auto space-y-6 custom-scrollbar relative z-10">
                              <div className="grid grid-cols-1 gap-5">
                  {event.rules.map((rule, idx) => (
                      <div key={idx} className="flex gap-4 group/rule">
                          <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#BA170D] font-black text-sm shrink-0">0{idx + 1}</div>
                          <p className="text-[11px] text-gray-200 font-bold leading-relaxed pt-2.5 uppercase tracking-tight group-hover:text-white transition-colors">{rule}</p>
                      </div>
                  ))}
                              </div>
                          </div>
                          <div className="p-6 bg-white/1 border-t border-white/10">
                              <button onClick={() => setShowRules(false)} className="w-full py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] hover:bg-[#BA170D] hover:text-white transition-all">
                                  Understand
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
