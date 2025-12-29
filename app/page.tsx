"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Shield, TrendingDown, BarChart3, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { SplashScreen } from "@/components/SplashScreen";
import Image from "next/image";

const Landing = () => {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Animated background mesh */}
      <div className="absolute inset-0" style={{ background: "var(--gradient-mesh)" }} />
      
      <div className="relative flex min-h-screen items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          {/* Logo + Brand */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.1, type: "spring", bounce: 0.5 }}
            className="mb-8 flex justify-center"
          >
            <Image
              src="/logo.png"
              alt="paperhands.cc"
              width={128}
              height={128}
              className="h-24 w-24 animate-float drop-shadow-[0_0_40px_rgba(74,222,128,0.6)] md:h-32 md:w-32"
            />
          </motion.div>

          <motion.h1
            className="shine-effect gradient-text mb-6 text-6xl font-black leading-tight md:text-8xl"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            paperhands.cc
          </motion.h1>
          
          <motion.p
            className="mb-4 text-2xl font-semibold text-foreground md:text-3xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Discover how much profit you left on the table
          </motion.p>

          <motion.p
            className="mb-12 text-lg text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Track your early exits, calculate your regret, and become a better trader
            <br />
            <span className="font-semibold text-primary">No wallet connection required</span> • 100% privacy-focused
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          >
            <Button
              size="lg"
              className="group relative overflow-hidden bg-gradient-to-r from-primary to-accent px-10 py-6 text-xl font-bold shadow-[var(--shadow-glow-strong)] transition-all hover:scale-105 hover:shadow-[var(--shadow-glow-strong)]"
              onClick={() => router.push("/dashboard")}
            >
              <span className="relative z-10 flex items-center">
                Start Analyzing
                <ArrowRight className="ml-2 h-6 w-6 transition-transform group-hover:translate-x-2" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 transition-opacity group-hover:opacity-100" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="border-2 border-primary px-8 py-6 text-lg font-semibold text-primary transition-all hover:bg-primary hover:text-primary-foreground hover:shadow-[var(--shadow-glow)]"
              onClick={() => router.push("/leaderboard")}
            >
              Hall of Shame
            </Button>
          </motion.div>

          {/* Feature badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-4"
          >
            {[
              { icon: Shield, text: "No Connection Required" },
              { icon: Zap, text: "Instant Analysis" },
              { icon: Lock, text: "100% Private" },
            ].map((badge, i) => (
              <motion.div
                key={badge.text}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 + i * 0.1 }}
                className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 backdrop-blur-sm"
              >
                <badge.icon className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">{badge.text}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            className="mt-20 grid grid-cols-1 gap-6 md:grid-cols-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            {[
              { value: "$2.4M+", label: "Total Regret Tracked", icon: TrendingDown },
              { value: "1,247", label: "Wallets Analyzed", icon: BarChart3 },
              { value: "8,932", label: "Paperhands Events", icon: Zap },
            ].map((stat, i) => (
              <motion.div
                key={i}
                className="card-money noise-texture group relative overflow-hidden rounded-2xl p-8 transition-all hover:scale-105"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 + i * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className="relative z-10">
                  <stat.icon className="mb-4 h-8 w-8 text-primary" />
                  <p className="mb-2 text-4xl font-black text-primary">{stat.value}</p>
                  <p className="text-sm font-medium text-foreground">{stat.label}</p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Enhanced Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -right-32 -top-32 h-[600px] w-[600px] rounded-full bg-primary/20 blur-[150px]"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-32 -left-32 h-[600px] w-[600px] rounded-full bg-accent/15 blur-[150px]"
          animate={{
            scale: [1.3, 1, 1.3],
            opacity: [0.4, 0.2, 0.4],
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div
          className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px]"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 20, repeat: Infinity }}
        />
      </div>
    </div>
  );
};

export default Landing;
