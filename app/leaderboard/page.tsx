"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Navigation, TopBar } from "@/components/Navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ArrowUpDown, TrendingDown, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumberShort } from "@/lib/utils";
import { useRouter } from "next/navigation";

type LeaderboardEntry = {
  id: string;
  wallet_address: string;
  total_regret: number;
  total_events: number;
  coins_traded: number;
  win_rate: number;
  avg_hold_time: number;
  analyzed_at: string;
};

type SortField = "total_regret" | "total_events" | "coins_traded" | "win_rate";

type DailyReward = {
  wallet_address: string;
  reward_amount: number;
  created_at: string;
};

const Leaderboard = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("total_regret");
  const [sortAsc, setSortAsc] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dailyReward, setDailyReward] = useState<DailyReward | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/leaderboard");
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      const payload = await response.json();
      setLeaderboardData((payload?.entries ?? []) as LeaderboardEntry[]);
      setDailyReward(payload?.dailyReward ?? null);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch leaderboard data
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const filteredData = leaderboardData.filter((entry) =>
    entry.wallet_address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedData = [...filteredData].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    return sortAsc ? aVal - bVal : bVal - aVal;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <TopBar />
      
      <main className="ml-64 mt-20 p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="mb-2 text-4xl font-black text-primary">Hall of Shame</h1>
            <p className="text-muted-foreground">
              Top 50 wallets with the highest realized regret • Refresh to see the latest analyses from the community
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="card-money noise-texture rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-accent/5 p-6"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                  Daily SOL Reward
                </p>
                <h2 className="text-2xl font-bold text-foreground">
                  A random wallet from today&apos;s top 20 gets $10 in SOL—every single day.
                </h2>
                <p className="text-sm text-muted-foreground">
                  Keep climbing the leaderboard for a chance to be selected at random after midnight UTC.
                </p>
              </div>
              <div className="rounded-xl bg-background/80 px-5 py-4 shadow-[var(--shadow-glow-soft)]">
                {dailyReward ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Most Recent Winner
                    </p>
                    <p className="font-mono text-lg font-bold text-primary">
                      {dailyReward.wallet_address.slice(0, 6)}...{dailyReward.wallet_address.slice(-6)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Awarded ${dailyReward.reward_amount.toFixed(2)} in SOL on{" "}
                      {new Date(dailyReward.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Winner pending
                    </p>
                    <p className="text-sm text-muted-foreground">
                      The first analysis of the day will trigger the daily drawing.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-money noise-texture rounded-2xl p-6"
          >
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by wallet address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-primary/30"
                />
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={fetchLeaderboard}
                  disabled={isLoading}
                  className="border-primary/40 text-primary hover:bg-primary/10"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                  {isLoading ? "Refreshing..." : "Refresh"}
                </Button>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                  Daily prize runs at 00:00 UTC
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  <p className="text-muted-foreground">Loading leaderboard...</p>
                </div>
              </div>
            ) : sortedData.length === 0 ? (
              <div className="py-12 text-center">
                <TrendingDown className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                <p className="text-xl font-semibold text-foreground mb-2">No Wallets Analyzed Yet</p>
                <p className="text-muted-foreground">Be the first to analyze a wallet on the Dashboard!</p>
                <Button
                  className="mt-4 bg-gradient-to-r from-primary to-accent"
                  onClick={() => router.push("/dashboard")}
                >
                  Analyze Now
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-primary/20">
                      <th className="px-4 py-3 text-left font-semibold">Rank</th>
                      <th className="px-4 py-3 text-left font-semibold">Wallet</th>
                      <th className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort("total_regret")}
                          className={cn("h-auto p-0 font-semibold", sortField === "total_regret" && "text-primary")}
                        >
                          Total Regret <ArrowUpDown className="ml-1 h-3 w-3" />
                        </Button>
                      </th>
                      <th className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort("coins_traded")}
                          className={cn("h-auto p-0 font-semibold", sortField === "coins_traded" && "text-primary")}
                        >
                          Coins <ArrowUpDown className="ml-1 h-3 w-3" />
                        </Button>
                      </th>
                      <th className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort("total_events")}
                          className={cn("h-auto p-0 font-semibold", sortField === "total_events" && "text-primary")}
                        >
                          Events <ArrowUpDown className="ml-1 h-3 w-3" />
                        </Button>
                      </th>
                      <th className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort("win_rate")}
                          className={cn("h-auto p-0 font-semibold", sortField === "win_rate" && "text-primary")}
                        >
                          Win Rate <ArrowUpDown className="ml-1 h-3 w-3" />
                        </Button>
                      </th>
                      <th className="px-4 py-3 text-right font-semibold">Analyzed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedData.map((entry, i) => (
                      <motion.tr
                        key={entry.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className="border-b border-border/50 transition-colors hover:bg-primary/5"
                      >
                        <td className="px-4 py-4">
                          <span className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${
                              i === 0 ? "bg-primary/20 text-primary" :
                              i === 1 ? "bg-accent/20 text-accent" :
                              i === 2 ? "bg-success/20 text-success" :
                              "bg-muted text-muted-foreground"
                            }`}>
                            {i + 1}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-mono">
                            <p className="font-semibold">{entry.wallet_address.slice(0, 8)}...{entry.wallet_address.slice(-6)}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right font-mono font-bold text-destructive">
                          ${formatNumberShort(entry.total_regret)}
                        </td>
                        <td className="px-4 py-4 text-right font-mono">
                          {entry.coins_traded}
                        </td>
                        <td className="px-4 py-4 text-right font-mono">{entry.total_events}</td>
                        <td className="px-4 py-4 text-right font-mono">
                          <span className={entry.win_rate > 50 ? "text-success" : "text-destructive"}>
                            {entry.win_rate}%
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right text-xs text-muted-foreground">
                          {new Date(entry.analyzed_at).toLocaleDateString()}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Leaderboard;
