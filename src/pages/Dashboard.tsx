import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, TrendingDown, DollarSign, Clock, Target } from "lucide-react";
import { Navigation, TopBar } from "@/components/Navigation";
import { AnimatedLoader } from "@/components/AnimatedLoader";
import { MetricCard } from "@/components/MetricCard";
import { Card } from "@/components/ui/card";
import { generateMockWalletStats } from "@/lib/mockData";
import { WalletStats } from "@/types/paperhands";
import { toast } from "@/hooks/use-toast";

const Dashboard = () => {
  const [walletAddress, setWalletAddress] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [walletStats, setWalletStats] = useState<WalletStats | null>(null);

  const handleAnalyze = () => {
    if (!walletAddress.trim()) {
      toast({ title: "Error", description: "Please enter a wallet address", variant: "destructive" });
      return;
    }

    setIsAnalyzing(true);
    setWalletStats(null);
  };

  const handleAnalysisComplete = () => {
    setIsAnalyzing(false);
    const stats = generateMockWalletStats(walletAddress);
    setWalletStats(stats);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <TopBar />
      
      <main className="ml-64 mt-16 p-8">
        <div className="mx-auto max-w-6xl space-y-8">
          {/* Search Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-glass noise-texture rounded-2xl p-8"
          >
            <h1 className="mb-6 text-3xl font-bold">Analyze Your Paperhands</h1>
            <div className="flex gap-3">
              <Input
                placeholder="Enter Solana wallet address..."
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                className="flex-1 bg-background/50"
              />
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="bg-primary px-8 font-semibold hover:shadow-[var(--shadow-glow)]"
              >
                <Search className="mr-2 h-4 w-4" />
                Analyze
              </Button>
            </div>
          </motion.div>

          {/* Loader */}
          <AnimatePresence>
            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Card className="card-glass noise-texture">
                  <AnimatedLoader onComplete={handleAnalysisComplete} />
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results */}
          <AnimatePresence>
            {walletStats && !isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Metrics Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <MetricCard
                    title="Paperhands Score"
                    value={walletStats.paperhandsScore}
                    subtitle="Out of 100"
                    icon={Target}
                    trend="down"
                    delay={0}
                  />
                  <MetricCard
                    title="Worst Loss"
                    value={`$${walletStats.worstLoss.toLocaleString()}`}
                    subtitle="Single event"
                    icon={TrendingDown}
                    trend="down"
                    delay={0.1}
                  />
                  <MetricCard
                    title="Total Regret"
                    value={`$${walletStats.totalRegret.toLocaleString()}`}
                    subtitle={`${walletStats.totalRegretPercent}% missed gains`}
                    icon={DollarSign}
                    trend="down"
                    delay={0.2}
                  />
                  <MetricCard
                    title="Avg Hold Time"
                    value={`${walletStats.avgHoldTime}d`}
                    subtitle={`vs ${walletStats.avgShouldaHoldTime}d optimal`}
                    icon={Clock}
                    trend="down"
                    delay={0.3}
                  />
                </div>

                {/* Top Regretted */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Card className="card-glass noise-texture p-6">
                    <h2 className="mb-4 text-xl font-bold">Top Regretted Tokens</h2>
                    <div className="space-y-3">
                      {walletStats.topRegrettedTokens.map((token, i) => (
                        <div
                          key={token.symbol}
                          className="flex items-center justify-between rounded-lg bg-background/50 p-4"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 font-semibold text-primary">
                              {i + 1}
                            </span>
                            <span className="font-medium">{token.symbol}</span>
                          </div>
                          <span className="font-mono text-lg font-bold text-destructive">
                            -${token.regretAmount.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>

                {/* Regret Gallery */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Card className="card-glass noise-texture p-6">
                    <h2 className="mb-4 text-xl font-bold">Regret Gallery</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                      {walletStats.events.slice(0, 4).map((event) => (
                        <div
                          key={event.id}
                          className="rounded-lg border border-border bg-background/50 p-4 transition-all hover:border-primary/50"
                        >
                          <div className="mb-3 flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold">{event.tokenSymbol}</h3>
                              <p className="text-sm text-muted-foreground">{event.tokenName}</p>
                            </div>
                            <span className="rounded-full bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive">
                              -{event.regretPercent}%
                            </span>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Sold at:</span>
                              <span className="font-medium">${event.sellPrice}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Peak was:</span>
                              <span className="font-medium">${event.peakPrice}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Regret:</span>
                              <span className="font-bold text-destructive">
                                -${event.regretAmount.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
