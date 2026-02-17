"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, updateProfile, User, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import ProfileSkeleton from "@/components/ProfileSkeleton";
import { fetchUserRegistrations, UserRegistrations } from "@/lib/registrationService";
import { TeamRegistration, categories } from "@/data/constant";
import Navbar from "@/components/Navbar";
import { ArrowLeft, LogOut } from "lucide-react";
import Toast, { ToastType } from "@/components/ui/Toast";

// Helper to calculate usage (same as in RegisterPage)
const getCounts = (soloEvents: string[], teamEvents: TeamRegistration[]) => {
    let counts = { offStage: 0, onStageInd: 0, onStageGroup: 0 };
    const allItems = categories.flatMap(c => c.items);
    
    // Deduplicate titles to ensure we only count each event once for the user
    const uniqueTitles = new Set([
        ...soloEvents,
        ...teamEvents.map(t => t.eventTitle)
    ]);
    
    // Helper to process a single title
    const process = (title: string) => {
         const ev = allItems.find(i => i.title === title);
         if (!ev) return;
         
         if (ev.categoryType === 'off_stage') {
             counts.offStage++;
         } else if (ev.categoryType === 'on_stage' || ev.categoryType === 'flagship') {
             if (ev.eventType === 'individual') {
                 counts.onStageInd++;
             } else {
                 counts.onStageGroup++;
             }
         }
    };
    
    uniqueTitles.forEach(process);
    return counts;
};

// Helper for event tags and colors
const getEventTheme = (title: string) => {
    const allItems = categories.flatMap(c => c.items);
    const ev = allItems.find(i => i.title === title);
    if (!ev) return { label: "UNKNOWN", type: "SOLO", color: "text-gray-400", bg: "bg-gray-400/10", border: "border-gray-400/20" };

    const typeLabel = ev.eventType === 'group' ? 'TEAM' : 'SOLO';

    if (ev.categoryType === 'off_stage') {
        return { label: "OFF-STAGE", type: typeLabel, color: "text-[#BA170D]", bg: "bg-[#BA170D]/10", border: "border-[#BA170D]/20" };
    }
    if (ev.eventType === 'individual') {
        return { label: "ON-STAGE (IND)", type: "SOLO", color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" };
    }
    return { label: "GROUP", type: "TEAM", color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20" };
};

const DEPARTMENTS = ["CIVIL", "MECH", "EEE", "CSE"];
const SEMESTERS = ["S2", "S4", "S6", "S8"];
const HOUSES = ["Red", "Blue", "Yellow", "Green"];

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [registrations, setRegistrations] = useState<UserRegistrations>({ soloEvents: [], teamEvents: [], totalCount: 0 });

  const [formData, setFormData] = useState({
    name: "",
    department: "",
    semester: "",
    house: "",
    mobile: "+91",
    collegeId: ""
  });

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: ToastType; isVisible: boolean }>({
    message: "",
    type: "info",
    isVisible: false
  });

  const showToast = (message: string, type: ToastType = "info") => {
    setToast({ message, type, isVisible: true });
  };


  useEffect(() => {
    if (!auth || !db) return;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login?callbackUrl=/profile"); // Redirect to login if not logged in
        return;
      }
      
      setUser(currentUser);
      
      try {
        if (db) {
            // Parallel Fetch: Profile & Registrations
            const userDocRef = doc(db, "users", currentUser.uid);
            
            const [userDoc, regData] = await Promise.all([
                getDoc(userDocRef),
                fetchUserRegistrations(currentUser.uid)
            ]);
    
            if (userDoc.exists()) {
                const userData = userDoc.data();
                setFormData({
                    name: userData.name || currentUser.displayName || "",
                    department: userData.department || "",
                    semester: userData.semester || "",
                    house: userData.house || "",
                    mobile: userData.mobile || "+91",
                    collegeId: userData.collegeId || ""
                });

            } else {
                 setFormData(prev => ({ ...prev, name: currentUser.displayName || "" }));
            }

            setRegistrations(regData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db || !user) return;
    
    // Validate all fields are present
    if (!formData.name || !formData.department || !formData.semester || !formData.house || !formData.mobile || !formData.collegeId) {
        showToast("Please fill in all fields including Mobile and College ID.", "error");
        return;
    }

    // Validate College ID Format: CMA/22/CS/033
    // Regex explanation:
    // ^CMA\/ - Starts with CMA/
    // \d{2}\/ - 2 digits (Year) then /
    // [A-Z]{2,3}\/ - 2 or 3 uppercase letters (Dept) then /
    // \d{3}$ - 3 digits (RollNo) then end
    const collegeIdRegex = /^CMA\/\d{2}\/[A-Z]{2,3}\/\d{3}$/;
    if (!collegeIdRegex.test(formData.collegeId)) {
        showToast("Invalid College ID. Expected: CMA/22/CS/033", "error");
        return;
    }


    setSaving(true);

    try {
      // 1. Update Auth Profile (Display Name)
      if (user.displayName !== formData.name) {
          await updateProfile(user, { displayName: formData.name });
      }

      // 2. Save to Firestore
      const updateData: any = {
        name: formData.name,
        email: user.email,
        department: formData.department,
        semester: formData.semester,
        house: formData.house,
        mobile: formData.mobile,
        collegeId: formData.collegeId,
        photoURL: user.photoURL,
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, "users", user.uid), updateData, { merge: true }); // Merge to avoid overwriting other fields if any


      console.log("Profile updated successfully");
      showToast("Profile Updated Successfully!", "success");
    } catch (error) {
      console.error("Error updating profile:", error);
      showToast("Failed to update profile. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };


    const handleCollegeIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.toUpperCase();
        const cleaned = val.replace(/[^A-Z0-9]/g, "");
        let formatted = "";

        if (cleaned.length > 0) formatted += cleaned.substring(0, 3);
        if (cleaned.length > 3) formatted += "/" + cleaned.substring(3, 5);
        if (cleaned.length > 5) {
            const remaining = cleaned.substring(5);
            const match = remaining.match(/^([A-Z]*)(.*)$/);
            if (match) {
                formatted += "/" + match[1];
                if (match[2]) formatted += "/" + match[2];
            }
        }
        
        // Allow user to manually enter '/' without it being deleted immediately
        // This preserves the slash if the user typed it, even if the auto-format wouldn't have added it yet
        if (val.endsWith('/') && !formatted.endsWith('/')) {
            formatted += "/";
        }

        setFormData({ ...formData, collegeId: formatted });
    };

    const handleLogout = async () => {
        if (!auth) return;
        try {
            await signOut(auth);
            showToast("Logged out successfully", "success");
            router.push("/");
        } catch (error) {
            console.error("Error signing out:", error);
            showToast("Failed to logout", "error");
        }
    };

    if (loading) return <ProfileSkeleton />;

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white font-outfit relative overflow-y-auto selection:bg-[#BA170D] selection:text-white">
            <Navbar />
            
            {/* Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[80vw] h-[80vw] bg-blue-900/10 blur-[100px] rounded-full"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[80vw] h-[80vw] bg-[#BA170D]/10 blur-[100px] rounded-full"></div>
            </div>

            <div className="relative z-10 container mx-auto px-4 py-24">
                
                <div className="max-w-7xl mx-auto flex flex-col gap-8">
                    {/* Back Button */}
                    <button 
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-gray-400 hover:text-[#BA170D] transition-colors self-start group"
                    >
                        <div className="p-2 rounded-full bg-white/5 group-hover:bg-[#BA170D]/10 border border-white/10 group-hover:border-[#BA170D]/50 transition-all">
                            <ArrowLeft size={20} />
                        </div>
                        <span className="font-medium">Back</span>
                    </button>

                    <div className="flex flex-col md:flex-row gap-8 items-start w-full">
                        {/* Profile Form Section */}
                        <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-black/40 backdrop-blur-xl border border-white/10 p-8 rounded-2xl w-full max-w-xl shadow-2xl flex-1 relative"
                        >
                            {/* Logout Button - Absolute Top Right */}
                            <button
                                onClick={handleLogout}
                                className="absolute top-6 right-6 p-2 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/50 transition-all group/logout"
                                title="Logout"
                            >
                                <LogOut size={18} className="group-hover/logout:scale-110 transition-transform" />
                            </button>

                        <div className="flex flex-col items-center mb-10">
                                <div className="relative w-24 h-24 mb-4 rounded-full overflow-hidden border-2 border-[#BA170D]">
                                    {user?.photoURL ? (
                                        <Image src={user.photoURL} alt="Profile" fill className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-[#BA170D]" />
                                    )}
                                </div>
                                <h1 className="text-3xl md:text-4xl font-black font-unbounded text-white text-center tracking-tighter mb-2 uppercase">YOUR PROFILE</h1>
                                <p className="text-gray-400 mt-1 text-center text-sm md:text-base tracking-wide">
                                    Update your details for event registration.
                                </p>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
                            {/* Name */}
                            <div>
                                <label className="block text-[10px] font-black text-[#BA170D] uppercase tracking-[0.2em] mb-3 ml-1">Full Name <span className="text-red-500">*</span></label>
                                <input 
                                    type="text" 
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-white text-base focus:border-[#BA170D] focus:ring-1 focus:ring-[#BA170D] focus:outline-hidden transition-all placeholder:text-white/20 font-medium"
                                    placeholder="Enter your full name"
                                    required
                                />
                            </div>

                            {/* College ID */}
                            <div>
                                <label className="block text-[10px] font-black text-[#BA170D] uppercase tracking-[0.2em] mb-3 ml-1">College ID <span className="text-red-500">*</span></label>
                                <input 
                                    type="text" 
                                    value={formData.collegeId}
                                    onChange={handleCollegeIdChange}
                                    maxLength={16}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-white text-base focus:border-[#BA170D] focus:ring-1 focus:ring-[#BA170D] focus:outline-hidden transition-all placeholder:text-white/20 font-medium uppercase"
                                    placeholder="CMA/22/CS/XXX"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1 ml-1">Format: CMA/YY/DEPT/XXX</p>
                            </div>

                        {/* Mobile Number */}
                        <div>
                            <label className="block text-[10px] font-black text-[#BA170D] uppercase tracking-[0.2em] mb-3 ml-1">Mobile Number <span className="text-red-500">*</span></label>
                            <input 
                                type="tel" 
                                value={formData.mobile}
                                onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-white text-base focus:border-[#BA170D] focus:ring-1 focus:ring-[#BA170D] focus:outline-hidden transition-all placeholder:text-white/20 font-medium"
                                placeholder="+91 XXXXX XXXXX"
                                required
                            />
                        </div>

                        {/* Department */}
                        <div>
                            <label className="block text-[10px] font-black text-[#BA170D] uppercase tracking-[0.2em] mb-3 ml-1">Department <span className="text-red-500">*</span></label>
                            <div className="grid grid-cols-2 gap-3">
                                {DEPARTMENTS.map((dept) => (
                                    <button
                                        key={dept}
                                        type="button"
                                        onClick={() => setFormData({...formData, department: dept})}
                                        className={`p-3 rounded-xl border text-xs md:text-sm font-black tracking-widest transition-all duration-300 ${
                                            formData.department === dept 
                                            ? "bg-[#BA170D] text-white border-[#BA170D] shadow-[0_0_20px_rgba(186,23,13,0.3)] scale-[1.02]" 
                                            : "bg-white/5 text-gray-400 border-white/10 hover:border-white/30 hover:bg-white/10"
                                        }`}
                                    >
                                        {dept}
                                    </button>
                                ))}
                            </div>
                            {!formData.department && <p className="text-red-500/50 text-[10px] mt-2 ml-1 font-bold tracking-wider">Required</p>}
                        </div>

                        {/* Semester */}
                        <div>
                            <label className="block text-[10px] font-black text-[#BA170D] uppercase tracking-[0.2em] mb-3 ml-1">Semester <span className="text-red-500">*</span></label>
                            <div className="grid grid-cols-4 gap-3">
                                {SEMESTERS.map((sem) => (
                                    <button
                                        key={sem}
                                        type="button"
                                        onClick={() => setFormData({...formData, semester: sem})}
                                        className={`p-3 rounded-xl border text-xs md:text-sm font-black tracking-widest transition-all duration-300 ${
                                            formData.semester === sem 
                                            ? "bg-[#BA170D] text-white border-[#BA170D] shadow-[0_0_20px_rgba(186,23,13,0.3)] scale-[1.02]" 
                                            : "bg-white/5 text-gray-400 border-white/10 hover:border-white/30 hover:bg-white/10"
                                        }`}
                                    >
                                        {sem}
                                    </button>
                                ))}
                            </div>
                            {!formData.semester && <p className="text-red-500/50 text-[10px] mt-2 ml-1 font-bold tracking-wider">Required</p>}
                        </div>

                        {/* House */}
                        <div>
                            <label className="block text-[10px] font-black text-[#BA170D] uppercase tracking-[0.2em] mb-3 ml-1">House <span className="text-red-500">*</span></label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {HOUSES.map((house) => {
                                    const isSelected = formData.house === house;
                                    let activeClass = "";
                                    
                                    if (house === "Red") {
                                        activeClass = isSelected ? "bg-red-600 text-white border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.4)]" : "hover:text-red-500 hover:border-red-500/50";
                                    } else if (house === "Blue") {
                                        activeClass = isSelected ? "bg-blue-600 text-white border-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.4)]" : "hover:text-blue-500 hover:border-blue-500/50";
                                    } else if (house === "Yellow") {
                                        activeClass = isSelected ? "bg-yellow-500 text-black border-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.4)]" : "hover:text-yellow-400 hover:border-yellow-400/50";
                                    } else if (house === "Green") {
                                        activeClass = isSelected ? "bg-green-600 text-white border-green-500 shadow-[0_0_20px_rgba(22,163,74,0.4)]" : "hover:text-green-500 hover:border-green-500/50";
                                    }

                                    return (
                                        <button
                                            key={house}
                                            type="button"
                                            onClick={() => setFormData({...formData, house: house})}
                                            className={`p-3 rounded-xl border text-xs md:text-sm font-black tracking-widest transition-all duration-300 ${
                                                isSelected 
                                                ? `${activeClass} scale-[1.02]` 
                                                : `bg-white/5 text-gray-400 ${activeClass} hover:bg-white/10 border-white/10`
                                            }`}
                                        >
                                            {house}
                                        </button>
                                    );
                                })}
                            </div>
                            {!formData.house && <p className="text-red-500/50 text-[10px] mt-2 ml-1 font-bold tracking-wider">Required</p>}
                        </div>

                        <button 
                            type="submit" 
                            disabled={saving}
                            className="mt-6 bg-white text-black font-black font-unbounded text-base md:text-lg py-4 rounded-xl hover:bg-[#BA170D] hover:text-white hover:shadow-[0_0_30px_rgba(186,23,13,0.3)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-tighter"
                        >
                            {saving ? "Saving..." : "Update Profile"}
                        </button>
                    </form>
                    </motion.div>

                    {/* Registrations Section */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-black/40 backdrop-blur-xl border border-white/10 p-8 md:p-10 rounded-2xl w-full max-w-xl shadow-2xl flex-1 flex flex-col h-full self-stretch"
                    >
                        <div className="flex flex-col items-center mb-10">
                            <h2 className="text-3xl md:text-4xl font-black font-unbounded text-white text-center tracking-tighter mb-2 uppercase">
                                YOUR EVENTS
                            </h2>
                            <p className="text-gray-400 mt-1 text-center text-sm md:text-base tracking-wide">
                                Your registered festival participations.
                            </p>
                        </div>

                        {/* Event Partition Counters (Sync with Register Page) */}
                        {(() => {
                            const counts = getCounts(registrations.soloEvents, registrations.teamEvents);
                            return (
                                <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
                                    {[
                                        { label: "OFF-STAGE", count: counts.offStage, max: 4, color: "text-[#BA170D]" },
                                        { label: "ON-STAGE (IND)", count: counts.onStageInd, max: 3, color: "text-blue-400" },
                                        { label: "GROUP", count: counts.onStageGroup, max: 2, color: "text-purple-400" },
                                    ].map((p, i) => (
                                        <div key={i} className="flex flex-col items-center px-4 py-3 bg-white/5 border border-white/10 rounded-xl min-w-[120px]">
                                            <span className="text-[9px] font-black text-white/40 mb-1 tracking-[0.2em]">{p.label}</span>
                                            <span className={`text-xl font-black font-unbounded ${p.color} tracking-tighter`}>
                                                {p.count}<span className="text-white/20 text-xs ml-1 font-bold">/ {p.max}</span>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}

                        <div className="flex-1 space-y-10 overflow-y-auto max-h-[1000px] pr-2 custom-scrollbar pb-10">
                            {(() => {
                                const allItems = categories.flatMap(c => c.items);
                                
                                // Partition the events
                                const offStageEvents: any[] = [];
                                const onStageIndEvents: any[] = [];
                                const groupEvents: any[] = [];

                                // Process Solo
                                registrations.soloEvents.forEach(title => {
                                    const ev = allItems.find(i => i.title === title);
                                    if (!ev) return;
                                    const item = { title, isTeam: false, id: `solo-${title}` };
                                    if (ev.categoryType === 'off_stage') offStageEvents.push(item);
                                    else if (ev.eventType === 'individual') onStageIndEvents.push(item);
                                    else groupEvents.push(item);
                                });

                                // Process Team
                                registrations.teamEvents.forEach(team => {
                                    const ev = allItems.find(i => i.title === team.eventTitle);
                                    if (!ev) return;
                                    const item = { title: team.eventTitle, isTeam: true, team, id: team.id };
                                    if (ev.categoryType === 'off_stage') offStageEvents.push(item);
                                    else if (ev.eventType === 'individual') onStageIndEvents.push(item);
                                    else groupEvents.push(item);
                                });

                                const renderEvent = (item: any) => {
                                    const theme = getEventTheme(item.title);
                                    return (
                                        <div key={item.id} className={`bg-white/5 border ${theme.border} p-4 rounded-xl group hover:border-[#BA170D]/30 transition-all`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-bold text-white text-base group-hover:text-[#BA170D] transition-all leading-tight">{item.title}</span>
                                                    <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${theme.color}`}>{theme.label}</span>
                                                </div>
                                                <span className={`text-[9px] px-2.5 py-1 rounded-sm ${theme.bg} ${theme.color} font-black tracking-widest border ${theme.border} uppercase`}>
                                                    {item.isTeam ? "TEAM" : "SOLO"}
                                                </span>
                                            </div>
                                            
                                            {item.isTeam && (
                                                <div className="space-y-2 mt-3 pt-3 border-t border-white/5">
                                                    <div className="text-[10px] text-gray-400 font-medium flex items-center gap-2">
                                                        <span className="uppercase tracking-widest text-gray-500">Role:</span>
                                                        <span className={item.team.leaderId === user?.uid ? "text-[#BA170D] font-black tracking-wide" : "text-white font-bold tracking-wide"}>
                                                            {item.team.leaderId === user?.uid ? "LEADER" : "MEMBER"}
                                                        </span>
                                                    </div>
                                                    {item.team.teamName && (
                                                        <div className="text-[10px] text-gray-500 flex items-center gap-2">
                                                            <span className="uppercase tracking-widest">Team:</span>
                                                            <span className="text-white/60 font-medium italic uppercase">{item.team.teamName}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                };

                                return (
                                    <>
                                        {/* Off-Stage Section */}
                                        <section>
                                            <h3 className="text-[#BA170D]/30 font-black uppercase tracking-[0.25em] text-[10px] mb-4 ml-1 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#BA170D]/50" />
                                                Off-Stage Events
                                            </h3>
                                            {offStageEvents.length === 0 ? (
                                                <p className="text-gray-500 italic text-xs ml-1 font-medium">No off-stage events registered.</p>
                                            ) : (
                                                <div className="grid gap-3">
                                                    {offStageEvents.map(renderEvent)}
                                                </div>
                                            )}
                                        </section>

                                        <div className="h-px bg-white/5 my-2" />

                                        {/* On-Stage Individual Section */}
                                        <section>
                                            <h3 className="text-blue-400/30 font-black uppercase tracking-[0.25em] text-[10px] mb-4 ml-1 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400/50" />
                                                On-Stage (Individual)
                                            </h3>
                                            {onStageIndEvents.length === 0 ? (
                                                <p className="text-gray-500 italic text-xs ml-1 font-medium">No individual on-stage events registered.</p>
                                            ) : (
                                                <div className="grid gap-3">
                                                    {onStageIndEvents.map(renderEvent)}
                                                </div>
                                            )}
                                        </section>

                                        <div className="h-px bg-white/5 my-2" />

                                        {/* Group Events Section */}
                                        <section>
                                            <h3 className="text-purple-400/30 font-black uppercase tracking-[0.25em] text-[10px] mb-4 ml-1 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-purple-400/50" />
                                                Group Events
                                            </h3>
                                            {groupEvents.length === 0 ? (
                                                <p className="text-gray-500 italic text-xs ml-1 font-medium">No group events registered.</p>
                                            ) : (
                                                <div className="grid gap-3">
                                                    {groupEvents.map(renderEvent)}
                                                </div>
                                            )}
                                        </section>
                                    </>
                                );
                            })()}
                        </div>
                        
                        <div className="mt-8 pt-6 border-t border-white/10">
                            <button 
                                onClick={() => router.push("/register")}
                                className="w-full bg-[#BA170D]/5 border border-[#BA170D]/10 text-[#BA170D] hover:bg-[#BA170D] hover:text-white font-black py-4 rounded-xl transition-all uppercase tracking-widest text-xs shadow-lg hover:shadow-[#BA170D]/20"
                            >
                                Manage Registrations
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>
            {/* Toast Notification */}
            <Toast 
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
            />
        </div>
    </div>
  );
}
