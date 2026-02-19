"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowLeft,
  Linkedin,
  Code,
  Coffee,
  Heart,
  Sparkles,
  Terminal,
  Cpu,
} from "lucide-react";
import gsap from "gsap";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function TechTeamPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);

  // Parallax background elements
  const bgY1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const bgY2 = useTransform(scrollYProgress, [0, 1], [0, -200]);

  useEffect(() => {
    // Subtle Mouse parallax
    const handleMouseMove = (e: MouseEvent) => {
      const cards = document.querySelectorAll(".dev-card");
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        (card as HTMLElement).style.setProperty("--mouse-x", `${x}px`);
        (card as HTMLElement).style.setProperty("--mouse-y", `${y}px`);
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const developers = [
    {
      initials: "AS",
      name: "Abhishek Santhosh",
      role: "Full Stack Developer",
      linkedin: "https://www.linkedin.com/in/abhishek-santhosh",
      skills: ["Next.js", "React", "Node.js", "TypeScript", "Firebase"],
      quote: "Designing interactions that feel like magic.",
      gradient: "from-blue-600 to-cyan-400",
      glow: "shadow-blue-500/20",
    },
    {
      initials: "JJ",
      name: "Joel Joy",
      role: "Full Stack Developer",
      linkedin: "https://www.linkedin.com/in/joeljoy123/",
      skills: ["Next.js", "React", "Node.js", "TypeScript", "Framer Motion"],
      quote: "Building the future, one pixel at a time.",
      gradient: "from-purple-600 to-pink-400",
      glow: "shadow-purple-500/20",
    },
  ];

  const stats = [
    {
      icon: Coffee,
      label: "Cups of Coffee",
      val: "∞",
      color: "text-amber-500",
    },
    { icon: Code, label: "Lines of Code", val: "10K+", color: "text-blue-500" },
    {
      icon: Heart,
      label: "Made with Love",
      val: "100%",
      color: "text-rose-500",
    },
  ];

  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-[#BA170D] selection:text-white overflow-hidden relative">
      <Navbar />

      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div
          style={{ y: bgY1 }}
          className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[120px]"
        />
        <motion.div
          style={{ y: bgY2 }}
          className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[150px]"
        />
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.03]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-size-[4rem_4rem] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]" />
      </div>

      <div className="relative z-10 pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-mono uppercase tracking-wider">
              Back to Home
            </span>
          </Link>
        </motion.div>

        {/* Hero Section */}
        <div className="flex flex-col items-center text-center mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative mb-6"
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-20 blur-xl rounded-full" />
            <div className="relative px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md inline-flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="text-xs font-bold tracking-widest uppercase bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Crafted With Passion
              </span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="text-5xl md:text-8xl font-black font-cinzel mb-8 tracking-tighter"
          >
            Meet the{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 animate-gradient-x">
              Tech Team
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-lg md:text-xl text-gray-400 max-w-2xl leading-relaxed"
          >
            Behind every smooth animation and seamless interaction lies lines of
            code written with dedication. We build digital experiences that
            inspire.
          </motion.p>
        </div>

        {/* Developers Showcase */}
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 mb-32">
          {developers.map((dev, index) => (
            <motion.div
              key={dev.name}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              className={`dev-card group relative rounded-3xl bg-[#0F0F0F] border border-white/5 overflow-hidden hover:border-white/10 transition-colors duration-500 ${dev.glow} hover:shadow-2xl`}
            >
              {/* Hover Spotlight Effect */}
              <div
                className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30"
                style={{
                  background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(255,255,255,0.06), transparent 40%)`,
                }}
              />

              <div className="relative p-8 md:p-12 z-20 flex flex-col h-full">
                {/* Top Decor */}
                <div className="flex justify-between items-start mb-8">
                  <div
                    className={`p-3 rounded-2xl bg-gradient-to-br ${dev.gradient} bg-opacity-10`}
                  >
                    <Terminal className="w-6 h-6 text-white" />
                  </div>
                  <Link
                    href={dev.linkedin}
                    target="_blank"
                    className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors group/link"
                  >
                    <Linkedin className="w-5 h-5 text-gray-400 group-hover/link:text-white transition-colors" />
                  </Link>
                </div>

                {/* Initials / Identity */}
                <div className="mb-8">
                  <h2 className="text-4xl md:text-5xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400 transition-all duration-300">
                    {dev.name}
                  </h2>
                  <p
                    className={`text-sm font-mono uppercase tracking-widest bg-gradient-to-r ${dev.gradient} bg-clip-text text-transparent font-bold`}
                  >
                    {dev.role}
                  </p>
                </div>

                {/* Quote */}
                <blockquote className="text-gray-400 italic mb-8 border-l-2 border-white/10 pl-4">
                  "{dev.quote}"
                </blockquote>

                {/* Skills */}
                <div className="mt-auto">
                  <div className="flex flex-wrap gap-2">
                    {dev.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1 text-xs font-medium rounded-full bg-white/5 border border-white/5 text-gray-300 group-hover:border-white/10 transition-colors"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Background Gradient Blob */}
              <div
                className={`absolute -right-20 -bottom-20 w-64 h-64 bg-gradient-to-br ${dev.gradient} opacity-10 blur-[80px] group-hover:opacity-20 transition-opacity duration-500 rounded-full pointer-events-none`}
              />
            </motion.div>
          ))}
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="relative border-y border-white/10 bg-white/[0.02] backdrop-blur-sm rounded-3xl p-12 mb-20 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse opacity-50" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center group">
                <div
                  className={`inline-flex p-4 rounded-full bg-white/5 mb-6 group-hover:scale-110 transition-transform duration-300 ${stat.color.replace("text-", "bg-").replace("500", "500/10")}`}
                >
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </div>
                <div className="text-5xl md:text-6xl font-black text-white font-cinzel mb-2 tracking-tight">
                  {stat.val}
                </div>
                <div className="text-xs md:text-sm text-gray-400 uppercase tracking-widest font-bold">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Footer Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-xl mx-auto"
        >
          <Cpu className="w-12 h-12 text-gray-600 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-white mb-4">
            Built for Impact.
          </h3>
          <p className="text-gray-500">
            We believe in crafting software that not only functions flawlessly
            but also delights the user at every interaction.
          </p>
        </motion.div>
      </div>

      <Footer />
    </main>
  );
}
