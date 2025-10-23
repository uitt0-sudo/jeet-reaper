import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, TrendingDown, DollarSign, Clock, Target, Award, AlertTriangle, Percent } from "lucide-react";
import { Navigation, TopBar } from "@/components/Navigation";
import { AnimatedLoader } from "@/components/AnimatedLoader";
import { MetricCard } from "@/components/MetricCard";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { generateTokenStats } from "@/lib/mockData";
import { WalletStats } from "@/types/paperhands";
import { toast } from "@/hooks/use-toast";
import { analyzePaperhands } from "@/services/paperhands";
import { isValidSolanaAddress } from "@/services/solana";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";

const Dashboard = () => {
  const [walletAddress, setWalletAddress] = useState("");
  const [selectedDays, setSelectedDays] = useState<number>(30);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [walletStats, setWalletStats] = useState<WalletStats | null>(null);
  const [progressMessage, setProgressMessage] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);

  const handleAnalyze = async () => {
    const trimmedAddress = walletAddress.trim();
    
    if (!trimmedAddress) {
      toast({ 
        title: "Error", 
        description: "Please enter a wallet address", 
        variant: "destructive" 
      });
      return;
    }

    if (!isValidSolanaAddress(trimmedAddress)) {
      toast({ 
        title: "Invalid Address", 
        description: "Please enter a valid Solana wallet address", 
        variant: "destructive" 
      });
      return;
    }

    setIsAnalyzing(true);
    setWalletStats(null);
    setProgressMessage("Initializing analysis...");
    setProgressPercent(0);

    try {
      const stats = await analyzePaperhands(trimmedAddress, selectedDays, (message, percent) => {
        setProgressMessage(message);
        setProgressPercent(percent);
      });
      setWalletStats(stats);
      
      const timeRangeText = `last ${selectedDays} days`;
      toast({ 
        title: "Analysis Complete!", 
        description: stats.totalEvents > 0 
          ? `Found ${stats.totalEvents} paperhands events (${timeRangeText})`
          : `No paperhands events detected (${timeRangeText})`,
      });
    } catch (error) {
      console.error('Analysis error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Could not analyze wallet';
      toast({ 
        title: "Analysis Failed", 
        description: errorMessage,
        variant: "destructive" 
      });
    } finally {
      setIsAnalyzing(false);
      setProgressMessage("");
      setProgressPercent(0);
    }
  };

  const handleAnalysisComplete = () => {
    // This is now handled in handleAnalyze
  };

  // Prepare chart data
  const pnlTimelineData = walletStats?.events.map((event, i) => ({
    date: event.sellDate,
    realized: event.realizedProfit,
    unrealized: event.unrealizedProfit,
    regret: event.regretAmount,
  })) || [];

  const tokenPerfData = walletStats ? generateTokenStats(walletStats.events) : [];

  const pieData = walletStats?.topRegrettedTokens.map((token, i) => ({
    name: token.symbol,
    value: token.regretAmount,
    color: `hsl(${142 + i * 30}, 76%, ${60 - i * 10}%)`,
  })) || [];

  const regretDistribution = walletStats?.events.map((event) => ({
    token: event.tokenSymbol,
    regret: event.regretAmount,
    percent: event.regretPercent,
  })) || [];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <TopBar />
      
      <main className="ml-64 mt-16 p-8">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Search Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-money noise-texture relative overflow-hidden rounded-3xl p-8"
          >
            <div className="relative z-10">
              <h1 className="mb-2 text-4xl font-black text-primary">Analyze Your Paperhands</h1>
              <p className="mb-6 text-muted-foreground">
                Enter any Solana wallet address to analyze their coin trades. No connection required.
              </p>
              
              {/* Time Range Selector */}
              <div className="mb-6">
                <h3 className="mb-3 text-sm font-semibold text-foreground">Time Range</h3>
                <RadioGroup 
                  value={selectedDays.toString()} 
                  onValueChange={(value) => setSelectedDays(Number(value))}
                  className="grid grid-cols-2 gap-3 md:grid-cols-4"
                >
                  <div className="relative">
                    <RadioGroupItem value="7" id="7days" className="peer sr-only" />
                    <Label
                      htmlFor="7days"
                      className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-primary/20 bg-background/50 p-3 transition-all hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10"
                    >
                      <span className="font-bold">Last 7 Days</span>
                      <span className="text-xs text-muted-foreground">~30-45 sec</span>
                    </Label>
                  </div>
                  
                  <div className="relative">
                    <RadioGroupItem value="30" id="30days" className="peer sr-only" />
                    <Label
                      htmlFor="30days"
                      className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-primary/20 bg-background/50 p-3 transition-all hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10"
                    >
                      <span className="font-bold">Last 30 Days</span>
                      <span className="text-xs text-muted-foreground">~1-2 min</span>
                    </Label>
                  </div>
                  
                  <div className="relative">
                    <RadioGroupItem value="90" id="90days" className="peer sr-only" />
                    <Label
                      htmlFor="90days"
                      className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-primary/20 bg-background/50 p-3 transition-all hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10"
                    >
                      <span className="font-bold">Last 90 Days</span>
                      <span className="text-xs text-muted-foreground">~2-3 min</span>
                    </Label>
                  </div>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="relative">
                          <RadioGroupItem value="all" id="alltime" className="peer sr-only" disabled />
                          <Label
                            htmlFor="alltime"
                            className="flex cursor-not-allowed flex-col items-center justify-center rounded-lg border-2 border-muted/20 bg-muted/10 p-3 opacity-50"
                          >
                            <span className="font-bold">All Time</span>
                            <span className="text-xs text-muted-foreground">Coming soon</span>
                          </Label>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Coming soon - Full history analysis with database caching</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </RadioGroup>
              </div>
              
              <div className="flex gap-3">
                <Input
                  placeholder="Enter Solana wallet address (e.g., 9xK2...7nL4)"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                  className="flex-1 border-primary/30 bg-background/80 text-lg backdrop-blur-sm"
                />
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="bg-gradient-to-r from-primary to-accent px-10 font-bold shadow-[var(--shadow-glow)] transition-all hover:scale-105"
                >
                  <Search className="mr-2 h-5 w-5" />
                  Analyze
                </Button>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
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
                  <AnimatedLoader 
                    message={progressMessage}
                    progress={progressPercent}
                  />
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
                className="space-y-8"
              >
                {/* Analysis Info Banner */}
                {walletStats.analysisDateRange && (
                  <Card className="border-primary/20 bg-primary/5 p-4">
                    <p className="text-center text-sm text-muted-foreground">
                      Analysis for <span className="font-semibold text-foreground">last {walletStats.analysisDateRange.daysBack} days</span>
                      {' '}({new Date(walletStats.analysisDateRange.startDate).toLocaleDateString()} - {new Date(walletStats.analysisDateRange.endDate).toLocaleDateString()})
                    </p>
                  </Card>
                )}
                
                {/* Header Stats */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <MetricCard
                    title="Paperhands Score"
                    value={walletStats.paperhandsScore}
                    subtitle="Higher = Worse"
                    icon={Target}
                    trend="down"
                    delay={0}
                  />
                  <MetricCard
                    title="Worst Single Loss"
                    value={`$${walletStats.worstLoss.toLocaleString()}`}
                    subtitle="Biggest regret"
                    icon={AlertTriangle}
                    trend="down"
                    delay={0.1}
                  />
                  <MetricCard
                    title="Total Regret"
                    value={`$${walletStats.totalRegret.toLocaleString()}`}
                    subtitle={`${walletStats.totalRegretPercent}% missed`}
                    icon={TrendingDown}
                    trend="down"
                    delay={0.2}
                  />
                  <MetricCard
                    title="Events Tracked"
                    value={walletStats.totalEvents}
                    subtitle={`${walletStats.winRate}% win rate`}
                    icon={Award}
                    trend="neutral"
                    delay={0.3}
                  />
                </div>

                {/* Additional Metrics */}
                <div className="grid gap-6 md:grid-cols-3">
                  <MetricCard
                    title="Avg Hold Time"
                    value={`${walletStats.avgHoldTime}d`}
                    subtitle={`Should've held ${walletStats.avgShouldaHoldTime}d`}
                    icon={Clock}
                    trend="down"
                    delay={0.4}
                  />
                  <MetricCard
                    title="Early Exits"
                    value={walletStats.totalExitedEarly}
                    subtitle="Sold too soon"
                    icon={DollarSign}
                    trend="down"
                    delay={0.5}
                  />
                  <MetricCard
                    title="Regret Rate"
                    value={`${walletStats.totalRegretPercent}%`}
                    subtitle="Unrealized vs realized"
                    icon={Percent}
                    trend="down"
                    delay={0.6}
                  />
                </div>

                {/* Charts Row 1 */}
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* PnL Timeline */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    <Card className="card-glass noise-texture p-6">
                      <h2 className="mb-4 text-xl font-bold">Profit Timeline</h2>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={pnlTimelineData}>
                          <defs>
                            <linearGradient id="colorRealized" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(142, 76%, 60%)" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="hsl(142, 76%, 60%)" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorRegret" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(0, 85%, 60%)" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="hsl(0, 85%, 60%)" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(142, 30%, 15%)" />
                          <XAxis dataKey="date" stroke="hsl(142, 76%, 90%)" fontSize={12} />
                          <YAxis stroke="hsl(142, 76%, 90%)" fontSize={12} />
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: "hsl(0, 0%, 6%)",
                              border: "1px solid hsl(142, 30%, 15%)",
                              borderRadius: "8px",
                            }}
                          />
                          <Area type="monotone" dataKey="realized" stroke="hsl(142, 76%, 60%)" fillOpacity={1} fill="url(#colorRealized)" />
                          <Area type="monotone" dataKey="regret" stroke="hsl(0, 85%, 60%)" fillOpacity={1} fill="url(#colorRegret)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Card>
                  </motion.div>

                  {/* Regret by Token Pie Chart */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <Card className="card-glass noise-texture p-6">
                      <h2 className="mb-4 text-xl font-bold">Regret Distribution</h2>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry: any) => {
                              const percent = walletStats ? ((entry.value / walletStats.totalRegret) * 100).toFixed(1) : '0.0';
                              return `${entry.name} ${percent}%`;
                            }}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: "hsl(0, 0%, 6%)",
                              border: "1px solid hsl(142, 30%, 15%)",
                              borderRadius: "8px",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </Card>
                  </motion.div>
                </div>

                {/* Charts Row 2 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                >
                  <Card className="card-glass noise-texture p-6">
                    <h2 className="mb-4 text-xl font-bold">Regret by Event</h2>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={regretDistribution}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(142, 30%, 15%)" />
                        <XAxis dataKey="token" stroke="hsl(142, 76%, 90%)" fontSize={12} />
                        <YAxis stroke="hsl(142, 76%, 90%)" fontSize={12} />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: "hsl(0, 0%, 6%)",
                            border: "1px solid hsl(142, 30%, 15%)",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar dataKey="regret" fill="hsl(0, 85%, 60%)" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                </motion.div>

                {/* Top Regretted Tokens */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 }}
                >
                  <Card className="card-money noise-texture p-6">
                    <h2 className="mb-6 text-2xl font-bold">Top Regretted Tokens</h2>
                    <div className="space-y-4">
                      {walletStats.topRegrettedTokens.map((token, i) => (
                        <div
                          key={token.symbol}
                          className="group relative overflow-hidden rounded-xl border border-primary/20 bg-background/50 p-6 transition-all hover:border-primary/50 hover:shadow-[var(--shadow-glow)]"
                        >
                          <div className="relative z-10 flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xl font-bold">
                                #{i + 1}
                              </span>
                              <div>
                                <h3 className="text-xl font-bold">{token.symbol}</h3>
                                <p className="text-sm text-muted-foreground">
                                  Opportunity cost
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-3xl font-black text-destructive">
                                -${token.regretAmount.toLocaleString()}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                If you had held longer
                              </p>
                            </div>
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-r from-destructive/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>

                {/* Token Performance Table */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1 }}
                >
                  <Card className="card-glass noise-texture p-6">
                    <h2 className="mb-6 text-2xl font-bold">Token Performance Breakdown</h2>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-primary/20">
                            <th className="px-4 py-3 text-left font-semibold">Token</th>
                            <th className="px-4 py-3 text-right font-semibold">Trades</th>
                            <th className="px-4 py-3 text-right font-semibold">Avg Entry</th>
                            <th className="px-4 py-3 text-right font-semibold">Avg Exit</th>
                            <th className="px-4 py-3 text-right font-semibold">Realized</th>
                            <th className="px-4 py-3 text-right font-semibold">Regret</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tokenPerfData.map((token) => (
                            <tr key={token.symbol} className="border-b border-border/50 transition-colors hover:bg-primary/5">
                              <td className="px-4 py-4 font-semibold">{token.symbol}</td>
                              <td className="px-4 py-4 text-right font-mono">{token.buys}</td>
                              <td className="px-4 py-4 text-right font-mono text-sm">
                                ${token.avgEntry.toFixed(6)}
                              </td>
                              <td className="px-4 py-4 text-right font-mono text-sm">
                                ${token.avgExit.toFixed(6)}
                              </td>
                              <td className="px-4 py-4 text-right font-mono font-semibold text-success">
                                +${token.realized.toLocaleString()}
                              </td>
                              <td className="px-4 py-4 text-right font-mono font-semibold text-destructive">
                                -${token.regret.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </motion.div>

                {/* Regret Gallery */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                >
                  <Card className="card-glass noise-texture p-6">
                    <h2 className="mb-6 text-2xl font-bold">Regret Gallery</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {walletStats.events.map((event) => (
                        <div
                          key={event.id}
                          className="group relative overflow-hidden rounded-xl border border-border bg-background/50 p-5 transition-all hover:border-primary/50 hover:shadow-[var(--shadow-glow)]"
                        >
                          <div className="mb-4 flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-bold">{event.tokenSymbol}</h3>
                              <p className="text-xs text-muted-foreground">{event.tokenName}</p>
                            </div>
                            <span className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-bold text-destructive">
                              -{event.regretPercent}%
                            </span>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Entry:</span>
                              <span className="font-mono font-medium">${event.buyPrice}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Exit:</span>
                              <span className="font-mono font-medium">${event.sellPrice}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Peak:</span>
                              <span className="font-mono font-medium text-primary">${event.peakPrice}</span>
                            </div>
                            <div className="flex justify-between border-t border-border pt-2">
                              <span className="text-muted-foreground">Realized:</span>
                              <span className="font-mono font-semibold text-success">
                                +${event.realizedProfit.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Regret:</span>
                              <span className="font-mono font-bold text-destructive">
                                -${event.regretAmount.toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
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
