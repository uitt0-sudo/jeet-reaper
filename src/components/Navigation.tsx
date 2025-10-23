import { Link, useLocation } from "react-router-dom";
import { Home, Trophy, FileQuestion, Code, Info, Gift } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";

const NAV_ITEMS = [
  { path: "/dashboard", icon: Home, label: "Dashboard" },
  { path: "/leaderboard", icon: Trophy, label: "Leaderboard" },
  { path: "/rewards", icon: Gift, label: "Rewards", badge: "Soon" },
  { path: "/how-it-works", icon: FileQuestion, label: "How It Works" },
  { path: "/api", icon: Code, label: "API Docs" },
  { path: "/about", icon: Info, label: "About" },
];

export const Navigation = () => {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-primary/20 bg-card/50 backdrop-blur-xl">
      <div className="flex h-20 items-center justify-center border-b border-primary/20">
        <Link to="/" className="flex items-center space-x-3">
          <img src={logo} alt="paperhands.cc" className="h-10 w-10" />
          <span className="shine-effect gradient-text text-2xl font-black">paperhands.cc</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-2 p-4">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start transition-all relative",
                  isActive ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-[var(--shadow-glow)]" : "hover:bg-primary/10 hover:text-primary"
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.label}
                {'badge' in item && (
                  <span className="ml-auto rounded-full bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">
                    {item.badge}
                  </span>
                )}
              </Button>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-primary/20 p-4">
        <a
          href="https://twitter.com/bnbpaperhands"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          @bnbpaperhands
        </a>
      </div>
    </aside>
  );
};

export const TopBar = () => {
  return (
    <header className="fixed left-64 right-0 top-0 z-30 flex h-20 items-center justify-between border-b border-primary/20 bg-card/50 px-8 backdrop-blur-xl">
      <div className="flex items-center space-x-4">
        <h2 className="text-xl font-bold text-primary">Solana Paperhands Tracker</h2>
      </div>
      
      <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2">
        <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
        <span className="text-sm font-medium text-primary">No Connection Required</span>
      </div>
    </header>
  );
};
