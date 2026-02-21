"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Results from "@/components/Results";

export default function ResultsPage() {
  return (
    <main className="bg-[#0A0A0A] min-h-screen text-white overflow-hidden selection:bg-[#BA170D] selection:text-white">
      <Navbar />

      {/* Push content below the floating navbar */}
      <div className="pt-28">
        <Results standalone />
      </div>

      <Footer />
    </main>
  );
}
