import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface AnimatedLoaderProps {
  message?: string;
  progress?: number;
}

export const AnimatedLoader = ({ message = "Analyzing...", progress = 0 }: AnimatedLoaderProps) => {

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
            key={message}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-muted-foreground"
          >
            {message}
          </motion.span>
          <span className="font-mono text-primary">{Math.round(progress)}%</span>
        </div>
        
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]" />
        </div>
      </div>
    </motion.div>
  );
};
