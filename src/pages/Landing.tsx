import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MarqueeBanner } from "@/components/MarqueeBanner";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <MarqueeBanner />
      
      <div className="flex min-h-[calc(100vh-3rem)] items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <motion.h1
            className="shine-effect gradient-text mb-6 text-6xl font-black leading-tight md:text-8xl"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            paperhands.cc
          </motion.h1>
          
          <motion.p
            className="mb-8 text-xl text-muted-foreground md:text-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Discover how much profit you left on the table
          </motion.p>

          <motion.p
            className="mb-12 text-lg text-muted-foreground/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Track your early exits, calculate your regret, and see how much
            <br />
            you could've made if you just HODL'd a little longer
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          >
            <Button
              size="lg"
              className="group relative overflow-hidden bg-primary px-8 text-lg font-bold text-primary-foreground transition-all hover:shadow-[var(--shadow-glow)]"
              onClick={() => navigate("/dashboard")}
            >
              <span className="relative z-10 flex items-center">
                Check My Wallet
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </span>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              onClick={() => navigate("/leaderboard")}
            >
              View Leaderboard
            </Button>
          </motion.div>

          <motion.div
            className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            {[
              { value: "$2.4M+", label: "Total Regret Tracked" },
              { value: "1,247", label: "Jeets Analyzed" },
              { value: "8,932", label: "Paperhands Events" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                className="card-glass noise-texture rounded-2xl p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + i * 0.1 }}
              >
                <p className="mb-2 text-3xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-primary/10 blur-[120px]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-accent/10 blur-[120px]"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
      </div>
    </div>
  );
};

export default Landing;
