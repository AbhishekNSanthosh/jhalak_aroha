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
    currentUser
}: EventRegistrationCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [teamMembers, setTeamMembers] = useState<{ email: string; uid?: string; name?: string; status?: string }[]>([]);
    const [searchEmail, setSearchEmail] = useState("");
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState("");

    // Toast State
    const [toast, setToast] = useState<{ message: string; type: ToastType; isVisible: boolean }>({
        message: "",
        type: "info",
        isVisible: false
    });

    const showToast = (message: string, type: ToastType = "info") => {
        setToast({ message, type, isVisible: true });
    };

    const isGroup = (event.minParticipants || 1) > 1;

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
        if (currentUser && searchEmail.toLowerCase() === currentUser.email?.toLowerCase()) {
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
            const q = query(collection(db, "users"), where("email", "==", searchEmail));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                setSearchError("User not found. Ask them to register/login first.");
            } else {
                const userDoc = snapshot.docs[0];
                const userData = userDoc.data();
                
                // Check if already added
                if (teamMembers.some(m => m.email === userData.email)) {
                    setSearchError("User already added to team.");
                } else if (currentUser.house && userData.house && currentUser.house !== userData.house) {
                   setSearchError(`Cannot add member. They are from ${userData.house}, but you are from ${currentUser.house}.`);
                } else {
                    setTeamMembers(prev => [...prev, { 
                        email: userData.email, 
                        uid: userDoc.id, 
                        name: userData.name,
                        status: 'pending' 
                    }]);
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
            showToast(`Minimum ${min} participants required (including you).`, "error");
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
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} 
            />
            <div className="p-6 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                             {event.tags.map(t => (
                                 <span key={t} className="text-[8px] uppercase font-black px-2 py-0.5 bg-white/10 rounded-sm text-gray-400 tracking-[0.2em] border border-white/5">
                                     {t}
                                 </span>
                             ))}
                        </div>
                        <h3 className="text-lg md:text-xl font-black font-unbounded text-white tracking-tighter leading-tight">{event.title}</h3>
                        <p className="text-[11px] text-gray-500 mt-2 line-clamp-2 font-medium tracking-wide uppercase leading-relaxed">{event.description}</p>
                    </div>
                    
                    {isLocked ? (
                        <div className="p-2 bg-white/10 rounded-full text-gray-400" title="Registered by Team Leader">
                            <Lock size={20} />
                        </div>
                    ) : (
                        <button
                            onClick={() => isGroup ? setIsExpanded(!isExpanded) : onToggle()}
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
                                    <h4 className="text-sm font-bold text-[#BA170D] mb-2">Your Team</h4>
                                    <ul className="space-y-2 mb-4">
                                        <li className="text-sm text-white flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-[#BA170D] flex items-center justify-center text-white text-xs font-bold">L</div>
                                            You (Leader)
                                        </li>
                                        {teamDetails?.members.filter(m => m.role !== 'leader').map((m, i) => (
                                            <li key={i} className="text-sm text-gray-300 flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs">M</div>
                                                {m.name} <span className="text-xs text-gray-500">({m.email})</span>
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
                                    <h4 className="text-sm font-bold text-white mb-2">Build Your Team</h4>
                                    
                                    {/* Member Input */}
                                    <div className="flex gap-2 mb-2 relative">
                                        <input 
                                            type="email" 
                                            placeholder="Member Email" 
                                            className={`flex-1 bg-black/20 border ${searchError ? 'border-red-500' : 'border-white/10'} rounded-lg px-3 py-2 text-sm text-white focus:border-[#BA170D] outline-hidden pr-8`}
                                            value={searchEmail}
                                            onChange={(e) => setSearchEmail(e.target.value)}
                                        />
                                        {searchLoading && (
                                            <div className="absolute right-3 top-2.5">
                                                <div className="w-4 h-4 border-2 border-[#BA170D] border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                        )}
                                    </div>
                                    {searchError && <p className="text-xs text-red-500 mb-2 flex items-center gap-1"><AlertCircle size={10}/> {searchError}</p>}

                                    {/* Added Members List */}
                                    {teamMembers.length > 0 && (
                                        <div className="space-y-1 mb-4">
                                            {teamMembers.map((m) => (
                                                <div key={m.email} className="flex justify-between items-center text-sm bg-white/5 px-2 py-1 rounded-sm">
                                                    <span className="text-gray-300">{m.name || m.email}</span>
                                                    <button onClick={() => setTeamMembers(teamMembers.filter(tm => tm.email !== m.email))}>
                                                        <X size={12} className="text-gray-500 hover:text-white" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <button 
                                        onClick={handleSubmitTeam}
                                        className="w-full py-2 bg-[#BA170D] text-white font-bold text-sm rounded-lg hover:bg-[#A00000]"
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
