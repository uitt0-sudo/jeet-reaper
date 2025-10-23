import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

const STATUS_MESSAGES = [
  "Scanning DEX trades...",
  "Analyzing entry points...",
  "Calculating exits...",
  "Replaying price action...",
  "Computing regret metrics...",
  "Finalizing paperhands score...",
];

interface AnimatedLoaderProps {
  onComplete?: () => void;
}

export const AnimatedLoader = ({ onComplete }: AnimatedLoaderProps) => {
  const [progress, setProgress] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    const duration = 7000;
    const interval = 50;
    const increment = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(() => onComplete?.(), 300);
          return 100;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [onComplete]);

  useEffect(() => {
    const statusTimer = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 1200);

    return () => clearInterval(statusTimer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex min-h-[400px] flex-col items-center justify-center space-y-8 p-8"
    >
      {/* Animated particles */}
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="h-24 w-24"
        >
          <Loader2 className="h-24 w-24 text-primary" />
        </motion.div>
        
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full bg-primary"
            animate={{
              x: [0, Math.cos((i * Math.PI) / 4) * 60],
              y: [0, Math.sin((i * Math.PI) / 4) * 60],
              opacity: [1, 0],
              scale: [1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeOut",
            }}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-md space-y-4">
        <div className="flex items-center justify-between text-sm">
          <motion.span
            key={statusIndex}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-muted-foreground"
          >
            {STATUS_MESSAGES[statusIndex]}
          </motion.span>
          <span className="font-mono text-primary">{Math.round(progress)}%</span>
        </div>
        
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-accent"
            style={{ width: `${progress}%` }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]" />
        </div>
      </div>
    </motion.div>
  );
};
