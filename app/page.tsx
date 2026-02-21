"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import ArohaRules from "@/components/ArohaRules";
import JhalakEvents from "@/components/JhalakEventsNew";
import JhalakRules from "@/components/JhalakRules";
import ChiefGuests from "@/components/ChiefGuests";
import Footer from "@/components/Footer";
import SplashScreen from "@/components/SplashScreen";
import Results from "@/components/Results";
import { AnimatePresence } from "framer-motion";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <main className="bg-[#0A0A0A] min-h-screen text-white overflow-hidden selection:bg-[#BA170D] selection:text-white">
      <AnimatePresence mode="wait">
        {isLoading && <SplashScreen onComplete={() => setIsLoading(false)} />}
      </AnimatePresence>

      <Navbar />
      <Hero startAnimation={!isLoading} />
      <ChiefGuests />
      <About />

      {/* Event Rules */}
      <ArohaRules />

      {/* Internal Events */}
      <JhalakEvents />
      <JhalakRules />

      {/* Results & Leaderboard */}
      <Results />

      <Footer />
    </main>
  );
}
