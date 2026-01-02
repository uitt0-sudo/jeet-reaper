import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const SCAN_MESSAGES = [
  "Checking wallet activity…",
  "Analyzing recent behavior…",
  "Calculating paperhands score…",
  "Reviewing past trades…",
];

export const AnimatedLoader = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % SCAN_MESSAGES.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex min-h-[400px] flex-col items-center justify-center space-y-8 p-8"
    >
      {/* Smooth spinning loader */}
      <div className="relative">
        <div className="h-20 w-20 rounded-full border-4 border-muted" />
        <div 
          className="absolute inset-0 h-20 w-20 rounded-full border-4 border-transparent border-t-primary animate-spin"
          style={{ animationDuration: "1s", animationTimingFunction: "ease-in-out" }}
        />
        
        {/* Subtle pulsing glow */}
        <div className="absolute inset-0 h-20 w-20 rounded-full bg-primary/10 animate-pulse" />
        
        {/* Floating particles */}
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-primary/60"
            animate={{
              x: [0, Math.cos((i * Math.PI) / 3) * 50],
              y: [0, Math.sin((i * Math.PI) / 3) * 50],
              opacity: [0.8, 0],
              scale: [1, 0.5],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeOut",
            }}
          />
        ))}
      </div>

      {/* Rotating message */}
      <div className="h-8 flex items-center justify-center">
        <motion.span
          key={messageIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="text-muted-foreground text-lg"
        >
          {SCAN_MESSAGES[messageIndex]}
        </motion.span>
      </div>
    </motion.div>
  );
};
