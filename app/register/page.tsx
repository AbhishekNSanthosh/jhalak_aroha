"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { categories, EventItem, TeamRegistration } from "@/data/constant";
import Navbar from "@/components/Navbar";
import { ArrowLeft, Save } from "lucide-react";
import toast from "react-hot-toast";
import ConfirmToast from "@/components/ConfirmToast";
import EventRegistrationCard from "@/components/EventRegistrationCard";
import EventCardSkeleton from "@/components/EventCardSkeleton";
import {
  fetchUserRegistrations,
  updateUserSoloRegistrations,
  createTeam,
  leaveTeam,
  validateRegistrationRules,
  fetchAllEventSettings,
} from "@/lib/registrationService";
import { motion, AnimatePresence } from "framer-motion";

// Helper to calculate usage
const getCounts = (soloEvents: string[], teamEvents: TeamRegistration[]) => {
  let counts = { offStage: 0, onStageInd: 0, onStageGroup: 0 };
  const allItems = categories.flatMap((c) => c.items);

  // Helper to process a single title
  const process = (title: string) => {
    const ev = allItems.find((i) => i.title === title);
    if (!ev) return;

    if (ev.categoryType === "off_stage") {
      counts.offStage++;
    } else if (
      ev.categoryType === "on_stage" ||
      ev.categoryType === "flagship"
    ) {
      if (ev.eventType === "individual") {
        counts.onStageInd++;
      } else {
        // Group (On-Stage or Flagship)
        counts.onStageGroup++;
      }
    }
  };

  soloEvents.forEach(process);
  teamEvents.forEach((t) => process(t.eventTitle));
  return counts;
};

export default function RegisterPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Server State
  const [registrations, setRegistrations] = useState<{
    soloEvents: string[];
    teamEvents: TeamRegistration[];
    totalCount: number;
  }>({ soloEvents: [], teamEvents: [], totalCount: 0 });

  // Local State (Deferred Updates)
  const [pendingSoloEvents, setPendingSoloEvents] = useState<string[]>([]);

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [eventSettings, setEventSettings] = useState<Record<string, boolean>>({});

  // Initial Auth & Data Fetch
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login?callbackUrl=/register");
        return;
      }
      setUser(currentUser);

      // Fetch User Profile, Registrations, and Event Settings in parallel
      try {
        const [regData, userDoc, settings] = await Promise.all([
          fetchUserRegistrations(currentUser.uid),
          getDoc(doc(db!, "users", currentUser.uid)),
          fetchAllEventSettings(),
        ]);

        setRegistrations(regData);
        setPendingSoloEvents(regData.soloEvents);
        setEventSettings(settings);

        if (userDoc.exists()) {
          setUserProfile({ ...userDoc.data(), uid: userDoc.id });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }

      setLoading(false);
    });
    return () => unsubscribe();
  }, [router, refreshTrigger]);

  const refreshData = () => setRefreshTrigger((prev) => prev + 1);

  // Compute derived state locally based on pending changes
  // const currentTotalCount = pendingSoloEvents.length + registrations.teamEvents.length; // Deprecated
  const counts = getCounts(pendingSoloEvents, registrations.teamEvents);

  const hasChanges =
    JSON.stringify(pendingSoloEvents.sort()) !==
    JSON.stringify(registrations.soloEvents.sort());

  const handleToggleSolo = (event: EventItem) => {
    const isSelected = pendingSoloEvents.includes(event.title);
    let newEvents;

    if (isSelected) {
      newEvents = pendingSoloEvents.filter((t) => t !== event.title);
    } else {
      // Check Limits using validator
      const validation = validateRegistrationRules(
        registrations.soloEvents,
        registrations.teamEvents,
        [...pendingSoloEvents, event.title],
        undefined,
      );

      if (!validation.valid) {
        toast.error(validation.message || "Validation failed");
        return;
      }
      newEvents = [...pendingSoloEvents, event.title];
    }
    setPendingSoloEvents(newEvents);
  };

  const handleSaveChanges = async () => {
    if (!user) return;
    setSaving(true);
    const result = await updateUserSoloRegistrations(
      user.uid,
      pendingSoloEvents,
    );
    if (result.success) {
      toast.success("Changes saved successfully!");
      refreshData(); // Re-fetch to sync everything
    } else {
      toast.error(result.message || "Failed to save changes");
    }
    setSaving(false);
  };

  const handleCreateTeam = async (event: EventItem, members: any[]) => {
    if (!user) return;

    if (hasChanges) {
      toast.error("Please save your pending solo event changes first.");
      return;
    }

    setActionLoading(event.title);

    // Validate Limits before calling service
    const validation = validateRegistrationRules(
      registrations.soloEvents,
      registrations.teamEvents,
      null,
      event.title,
    );
    if (!validation.valid) {
      toast.error(validation.message || "Validation failed");
      setActionLoading(null);
      return;
    }

    const fullTeam = [
      {
        uid: user.uid,
        name: user.displayName || "Leader",
        email: user.email || "",
        role: "leader",
        status: "confirmed",
      },
      ...members.map((m) => ({
        uid: m.uid,
        name: m.name,
        email: m.email,
        role: "member",
        status: "confirmed",
      })),
    ];

    const result = await createTeam(
      user.uid,
      user.displayName || "User",
      user.email || "",
      event.title,
      fullTeam as any,
    );
    if (result.success) {
      toast.success("Team created successfully!");
      refreshData();
    } else {
      toast.error(result.message || "Failed to create team");
    }
    setActionLoading(null);
  };

  const handleLeaveTeam = (teamId: string) => {
    if (!user) return;

    toast.custom(
      (t) => (
        <ConfirmToast
          t={t}
          message="Are you sure you want to leave/disband this team?"

          onConfirm={async () => {
            // Optimistic UI Update: Remove team immediately from view
            setRegistrations((prev) => ({
              ...prev,
              teamEvents: prev.teamEvents.filter((t) => t.id !== teamId),
              totalCount: prev.totalCount - 1,
            }));

            const result = await leaveTeam(user.uid, teamId);
            if (result.success) {
              toast.success("Left team successfully");
              refreshData();
            } else {
              toast.error(result.message || "Failed to leave team");
              refreshData(); // Revert on failure (implied by re-fetch)
            }
          }}
        />
      ),
      { duration: Infinity },
    );
  };



  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white font-outfit relative overflow-y-auto selection:bg-[#BA170D] selection:text-white">
      <Navbar />

      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[80vw] h-[80vw] bg-blue-900/10 blur-[100px] rounded-full"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[80vw] h-[80vw] bg-[#BA170D]/10 blur-[100px] rounded-full"></div>
      </div>

      <div className="max-w-7xl mx-auto mt-24 px-4 pb-20 relative z-10">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-[#BA170D] transition-colors mb-8 group"
        >
          <div className="p-2 rounded-full bg-white/5 group-hover:bg-[#BA170D]/10 border border-white/10 group-hover:border-[#BA170D]/50 transition-all">
            <ArrowLeft size={20} />
          </div>
          <span className="font-medium">Back</span>
        </button>

        <header className="mb-12">
          <h1 className="text-3xl md:text-5xl font-black font-unbounded text-white mb-6 tracking-tighter">
            EVENT REGISTRATION
          </h1>

          {/* Updated Status Display with 3 counters */}
          <div className="flex flex-wrap gap-4">
            {[
              {
                label: "Off-Stage",
                count: counts.offStage,
                max: 4,
                color: "text-[#BA170D]",
              },
              {
                label: "On-Stage (Ind)",
                count: counts.onStageInd,
                max: 3,
                color: "text-blue-400",
              },
              {
                label: "Group",
                count: counts.onStageGroup,
                max: 2,
                color: "text-purple-400",
              },
            ].map((p, i) => (
              <div
                key={i}
                className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-xl min-w-[140px]"
              >
                <span className="text-gray-400 uppercase tracking-[0.2em] text-[9px] font-black">
                  {p.label}
                </span>
                <div className="flex items-baseline gap-1">
                  <span
                    className={`text-2xl font-black font-unbounded ${p.color} tracking-tighter`}
                  >
                    {p.count}
                  </span>
                  <span className="text-white/20 text-xs font-bold">
                    / {p.max}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </header>

        <div className="space-y-16">
          {categories
            .filter((cat) => cat.title !== "Flagship Event")
            .map((cat) => (
              <section key={cat.title}>
                <h2 className="text-xl md:text-2xl font-black font-unbounded text-[#BA170D] mb-8 flex items-center gap-5 uppercase tracking-tighter">
                  {cat.title}
                  <div className="h-px flex-1 bg-white/10"></div>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {loading
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <EventCardSkeleton key={i} />
                      ))
                    : cat.items.map((event) => {
                        // Check local pending state
                        const isSoloRegistered = pendingSoloEvents.includes(
                          event.title,
                        );

                        // Check if registered as Team (server state)
                        const teamReg = registrations.teamEvents.find(
                          (t) => t.eventTitle === event.title,
                        );

                        const isSelected = isSoloRegistered || !!teamReg;
                        const isLocked =
                          !!teamReg && teamReg.leaderId !== user?.uid;
                        const isClosed = eventSettings[event.title] || false;

                        return (
                          <EventRegistrationCard
                            key={event.title}
                            event={event}
                            isSelected={isSelected}
                            isLocked={isLocked}
                            isRegistrationClosed={isClosed}
                            teamDetails={teamReg}
                            onToggle={() => handleToggleSolo(event)} // Handles local state
                            onCreateTeam={(members) =>
                              handleCreateTeam(event, members)
                            }
                            onLeaveTeam={async () => {
                              if (teamReg?.id) await handleLeaveTeam(teamReg.id);
                            }}
                            currentUser={userProfile || user}
                          />
                        );
                      })}
                </div>
              </section>
            ))}
        </div>
      </div>

      {/* Floating Save Button */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
          >
            <button
              onClick={handleSaveChanges}
              disabled={saving}
              className="bg-white text-black px-8 py-4 rounded-full font-black font-unbounded flex items-center gap-3 shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:scale-105 hover:bg-[#BA170D] transition-all active:scale-95 disabled:opacity-50 uppercase tracking-tighter text-sm"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Save size={20} />
              )}
              Save Changes
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
