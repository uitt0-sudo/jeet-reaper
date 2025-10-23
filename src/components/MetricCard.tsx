import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Card } from "./ui/card";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  delay?: number;
}

export const MetricCard = ({ title, value, subtitle, icon: Icon, trend, delay = 0 }: MetricCardProps) => {
  const trendColors = {
    up: "text-success",
    down: "text-destructive",
    neutral: "text-primary",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ scale: 1.02, y: -5 }}
    >
      <Card className="card-glass noise-texture group relative overflow-hidden p-6 transition-all hover:border-primary/50 hover:shadow-[var(--shadow-glow)]">
        <div className="relative z-10">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
            {Icon && (
              <div className="rounded-full bg-primary/20 p-2 transition-all group-hover:scale-110 group-hover:bg-primary/30">
                <Icon className="h-5 w-5 text-primary" />
              </div>
            )}
          </div>
          
          <div className="space-y-1">
            <p className={`text-4xl font-black ${trend ? trendColors[trend] : "text-foreground"}`}>
              {value}
            </p>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      </Card>
    </motion.div>
  );
};
