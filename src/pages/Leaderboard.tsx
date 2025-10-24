import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Navigation, TopBar } from "@/components/Navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ArrowUpDown, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { formatNumberShort } from "@/lib/utils";

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

const Leaderboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("total_regret");
  const [sortAsc, setSortAsc] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch leaderboard data
  useEffect(() => {
    fetchLeaderboard();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('wallet_analyses_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wallet_analyses'
        },
        (payload) => {
          console.log('New wallet analysis:', payload);
          setLeaderboardData((current) => [payload.new as LeaderboardEntry, ...current]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('wallet_analyses')
        .select('*')
        .order('total_regret', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLeaderboardData(data || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
              Real-time leaderboard of analyzed wallets • Updates automatically when new wallets are analyzed
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-money noise-texture rounded-2xl p-6"
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by wallet address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-primary/30"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                <span className="text-sm font-medium text-primary">Live</span>
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
                  onClick={() => window.location.href = '/dashboard'}
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
