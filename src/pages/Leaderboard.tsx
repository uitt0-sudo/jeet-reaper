import { useState } from "react";
import { motion } from "framer-motion";
import { Navigation, TopBar } from "@/components/Navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ArrowUpDown } from "lucide-react";
import { MOCK_LEADERBOARD } from "@/lib/mockData";
import { ProfileModal } from "@/components/ProfileModal";
import { generateMockWalletStats } from "@/lib/mockData";
import { WalletStats } from "@/types/paperhands";

type SortField = "rank" | "totalRegret" | "regretPercent" | "totalEvents";

const Leaderboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("rank");
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedWallet, setSelectedWallet] = useState<WalletStats | null>(null);

  const filteredData = MOCK_LEADERBOARD.filter(
    (entry) =>
      entry.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.ensName?.toLowerCase().includes(searchTerm.toLowerCase())
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

  const handleAnalyze = (address: string) => {
    const stats = generateMockWalletStats(address);
    setSelectedWallet(stats);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <TopBar />
      
      <main className="ml-64 mt-16 p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <h1 className="text-3xl font-bold">Paperhands Leaderboard</h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-glass noise-texture rounded-2xl p-6"
          >
            <div className="mb-6 flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by address or ENS..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("rank")}
                        className="h-auto p-0 font-semibold"
                      >
                        Rank <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">Wallet</th>
                    <th className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("totalRegret")}
                        className="h-auto p-0 font-semibold"
                      >
                        Total Regret <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("regretPercent")}
                        className="h-auto p-0 font-semibold"
                      >
                        Regret % <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("totalEvents")}
                        className="h-auto p-0 font-semibold"
                      >
                        Events <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-right font-semibold">Score</th>
                    <th className="px-4 py-3 text-center font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedData.map((entry, i) => (
                    <motion.tr
                      key={entry.address}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="border-b border-border/50 transition-colors hover:bg-primary/5"
                    >
                      <td className="px-4 py-4">
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-full font-bold ${
                            entry.rank === 1
                              ? "bg-primary/20 text-primary"
                              : entry.rank === 2
                              ? "bg-accent/20 text-accent"
                              : entry.rank === 3
                              ? "bg-success/20 text-success"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {entry.rank}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium">{entry.ensName || entry.address}</p>
                          {entry.ensName && (
                            <p className="text-sm text-muted-foreground">{entry.address}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right font-mono font-semibold text-destructive">
                        ${entry.totalRegret.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-destructive">
                        {entry.regretPercent}%
                      </td>
                      <td className="px-4 py-4 text-right font-mono">{entry.totalEvents}</td>
                      <td className="px-4 py-4 text-right">
                        <span className="inline-block rounded-full bg-destructive/10 px-3 py-1 font-mono font-bold text-destructive">
                          {entry.paperhandsScore}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAnalyze(entry.address)}
                          className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                        >
                          Analyze
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </main>

      {selectedWallet && (
        <ProfileModal
          open={!!selectedWallet}
          onOpenChange={(open) => !open && setSelectedWallet(null)}
          wallet={selectedWallet}
        />
      )}
    </div>
  );
};

export default Leaderboard;
