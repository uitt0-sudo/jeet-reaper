import { Link, useLocation } from "react-router-dom";
import { Home, Trophy, User, FileQuestion, Code, Info } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/dashboard", icon: Home, label: "Dashboard" },
  { path: "/leaderboard", icon: Trophy, label: "Leaderboard" },
  { path: "/how-it-works", icon: FileQuestion, label: "How It Works" },
  { path: "/api", icon: Code, label: "API Docs" },
  { path: "/about", icon: Info, label: "About" },
];

export const Navigation = () => {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-card/50 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-center border-b border-border">
        <Link to="/" className="flex items-center space-x-2">
          <span className="shine-effect gradient-text text-2xl font-black">paperhands.cc</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  isActive && "bg-primary/10 text-primary hover:bg-primary/20"
                )}
              >
                <item.icon className="mr-3 h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
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
    <header className="fixed left-64 right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/50 px-6 backdrop-blur-xl">
      <div className="flex items-center space-x-4">
        <h2 className="text-lg font-semibold">Solana Paperhands Checker</h2>
      </div>
      
      <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
        Connect Wallet (Mock)
      </Button>
    </header>
  );
};
