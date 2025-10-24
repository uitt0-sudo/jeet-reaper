import { Link, useLocation } from "react-router-dom";
import { Home, Trophy, FileQuestion, Code, Info, Gift, TrendingUp, ExternalLink, Twitter } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";
import { useEffect, useState } from "react";

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
  const [solPrice, setSolPrice] = useState<number | null>(null);

  useEffect(() => {
    const fetchSolPrice = async () => {
      try {
        // Using Jupiter price API (more reliable for crypto prices)
        const response = await fetch('https://price.jup.ag/v4/price?ids=SOL');
        const data = await response.json();
        setSolPrice(data.data.SOL.price);
      } catch (error) {
        console.error('Failed to fetch SOL price:', error);
      }
    };
    fetchSolPrice();
    const interval = setInterval(fetchSolPrice, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

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

      {/* Live SOL Price */}
      <div className="mx-4 mb-3 rounded-lg border border-primary/30 bg-gradient-to-br from-primary/10 to-accent/10 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-muted-foreground">SOL Price</span>
          </div>
          <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
        </div>
        <div className="mt-2">
          {solPrice ? (
            <div className="text-2xl font-black gradient-text">${solPrice.toFixed(2)}</div>
          ) : (
            <div className="text-xl text-muted-foreground">Loading...</div>
          )}
        </div>
      </div>

      {/* Platform Stats - Match Homepage */}
      <div className="mx-4 mb-3 rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Live Stats</span>
        </div>
        <div className="space-y-2">
          <div>
            <div className="text-xl font-black text-destructive">$2.4M+</div>
            <div className="text-xs text-muted-foreground">Total Regret Tracked</div>
          </div>
          <div>
            <div className="text-xl font-black gradient-text">1,247</div>
            <div className="text-xs text-muted-foreground">Wallets Analyzed</div>
          </div>
          <div>
            <div className="text-xl font-black text-primary">8,932</div>
            <div className="text-xs text-muted-foreground">Paperhands Events</div>
          </div>
        </div>
      </div>

      {/* Community */}
      <div className="mx-4 mb-3 rounded-lg border border-primary/20 bg-background/30 p-3">
        <div className="mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Community</span>
        </div>
        <div className="space-y-2">
          <a
            href="https://discord.gg/paperhands"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-lg bg-primary/5 px-3 py-2 text-xs font-medium text-foreground transition-all hover:bg-primary/10 hover:text-primary"
          >
            <span>🎮 Join Discord</span>
          </a>
          <a
            href="https://t.me/paperhands"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-lg bg-primary/5 px-3 py-2 text-xs font-medium text-foreground transition-all hover:bg-primary/10 hover:text-primary"
          >
            <span>✈️ Telegram Group</span>
          </a>
          <button
            onClick={() => window.location.href = '/api'}
            className="w-full flex items-center justify-between rounded-lg bg-accent/10 px-3 py-2 text-xs font-medium text-accent transition-all hover:bg-accent/20"
          >
            <span>🔌 API Access</span>
          </button>
        </div>
      </div>

      <div className="border-t border-primary/20 p-4">
        <a
          href="https://twitter.com/bnbpaperhands"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <Twitter className="h-4 w-4" />
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
