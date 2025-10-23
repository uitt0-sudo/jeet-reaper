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
    neutral: "text-muted-foreground",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Card className="card-glass noise-texture relative overflow-hidden p-6 transition-all hover:shadow-[var(--shadow-glow)]">
        <div className="relative z-10">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
            {Icon && <Icon className="h-5 w-5 text-primary" />}
          </div>
          
          <div className="space-y-1">
            <p className={`text-3xl font-bold ${trend ? trendColors[trend] : "text-foreground"}`}>
              {value}
            </p>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
