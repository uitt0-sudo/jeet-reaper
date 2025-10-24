import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, TrendingDown, DollarSign, Clock, Target, Award, AlertTriangle, Percent, Sparkles, CheckCircle2 } from "lucide-react";
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
import TokenLogo from "@/components/TokenLogo";
import { formatNumberShort } from "@/lib/utils";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";

// Calculate cashback reward based on regret amount (reduced by 30%)
const calculateCashback = (regretAmount: number): string => {
  if (regretAmount < 100) return "$1-3";
  if (regretAmount < 300) return "$7-21";
  if (regretAmount < 1000) return "$35-70";
  if (regretAmount < 5000) return "$140-350";
  if (regretAmount < 10000) return "$525-1,050";
  if (regretAmount < 50000) return "$1,400-3,500";
  if (regretAmount < 100000) return "$5,600-10,500";
  return "$14,000+";
};

const Dashboard = () => {
  const [walletAddress, setWalletAddress] = useState("");
  const [selectedDays, setSelectedDays] = useState<number>(30);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [walletStats, setWalletStats] = useState<WalletStats | null>(null);
  const [progressMessage, setProgressMessage] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);
  const [showSlow, setShowSlow] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);

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

    // Show a helpful message after 10 seconds
    const slowAnalysisTimer = setTimeout(() => {
      setShowSlow(true);
      toast({
        title: "Still analyzing...",
        description: "Checking thousands of transactions takes time. This usually completes in 15-30 seconds.",
        duration: 5000,
      });
    }, 10000);

    try {
      const stats = await analyzePaperhands(trimmedAddress, selectedDays, (message, percent) => {
        setProgressMessage(message);
        setProgressPercent(percent);
      });
      setWalletStats(stats);
      
      // Save to database for leaderboard
      try {
        await supabase.from('wallet_analyses').insert({
          wallet_address: trimmedAddress,
          total_regret: stats.totalRegret,
          total_events: stats.totalEvents,
          coins_traded: stats.coinsTraded ?? 0,
          win_rate: stats.winRate,
          avg_hold_time: stats.avgHoldTime,
          top_regretted_tokens: stats.topRegrettedTokens,
          analysis_date_range: stats.analysisDateRange,
        });
        console.log('Saved wallet analysis to database');
      } catch (dbError) {
        console.error('Failed to save to database:', dbError);
        // Don't fail the entire analysis if database save fails
      }
      
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
      clearTimeout(slowAnalysisTimer);
      setIsAnalyzing(false);
      setProgressMessage("");
      setProgressPercent(0);
    }
  };

  const handleAnalysisComplete = () => {
    // This is now handled in handleAnalyze
  };

  const calculateTotalCashback = () => {
    if (!walletStats) return 0;
    return Math.round(walletStats.topRegrettedTokens.reduce((sum, t) => {
      const range = calculateCashback(t.regretAmount);
      const avg = range.includes('-') 
        ? (parseInt(range.split('$')[1].split('-')[0].replace(/,/g, '')) + parseInt(range.split('-')[1].replace(/[,$+]/g, ''))) / 2
        : parseInt(range.replace(/[,$+]/g, ''));
      return sum + avg;
    }, 0));
  };

  const handleClaimRewards = async () => {
    setIsClaiming(true);
    
    // Simulate processing with visual feedback
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    setIsClaiming(false);
    setHasClaimed(true);
    
    const totalCashback = calculateTotalCashback();
    
    toast({
      title: "🎉 Cashback Claimed Successfully!",
      description: (
        <div className="mt-2 space-y-2">
          <p className="text-2xl font-bold text-primary">${totalCashback.toLocaleString()} USD</p>
          <p className="text-sm text-muted-foreground">Your cashback will be sent to your wallet in 2-5 minutes. Check your transaction history shortly!</p>
        </div>
      ),
      duration: 10000,
    });
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

  // Unique coins traded (by mint or symbol as fallback)
  const coinsTraded = walletStats?.coinsTraded ?? (walletStats ? new Set(walletStats.events.map(e => e.tokenMint || e.tokenSymbol)).size : 0);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <TopBar />
      
      <main className="ml-64 mt-16 p-8">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Beta Disclaimer Banner - Slim Style */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-primary/30 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 px-6 py-3"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-primary" />
              <div className="flex-1 text-sm">
                <span className="font-bold text-foreground">v0.1 Beta</span>
                <span className="text-muted-foreground"> • $100+ events only • Current prices (historical peaks coming soon) • Some tokens may lack logos/data</span>
              </div>
            </div>
          </motion.div>

          {/* Search Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
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
                    <div className="space-y-2 text-center">
                      <p className="text-sm text-muted-foreground">
                        Analysis for <span className="font-semibold text-foreground">last {walletStats.analysisDateRange.daysBack} days</span>
                        {' '}({new Date(walletStats.analysisDateRange.startDate).toLocaleDateString()} - {new Date(walletStats.analysisDateRange.endDate).toLocaleDateString()})
                      </p>
                      <p className="text-xs text-muted-foreground">
                        💡 "Missed Since Sell" uses current prices only. Historical peaks coming soon with Birdeye integration.
                      </p>
                    </div>
                  </Card>
                )}
                
                {/* Header Stats - Simplified and Honest */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <MetricCard
                    title="Coins Traded"
                    value={coinsTraded}
                    subtitle={`${walletStats.totalEvents} total events`}
                    icon={Award}
                    trend="neutral"
                    delay={0}
                  />
                  <MetricCard
                    title="Missed Since Sell"
                    value={`$${walletStats.totalRegret.toLocaleString()}`}
                    subtitle="If still holding (current price)"
                    icon={TrendingDown}
                    trend="down"
                    delay={0.1}
                  />
                  <MetricCard
                    title="Win Rate"
                    value={`${walletStats.winRate}%`}
                    subtitle={`${walletStats.totalEvents} trades analyzed`}
                    icon={Target}
                    trend={walletStats.winRate > 50 ? "up" : "down"}
                    delay={0.2}
                  />
                  <MetricCard
                    title="Avg Hold Time"
                    value={`${walletStats.avgHoldTime}d`}
                    subtitle="Days to sell"
                    icon={Clock}
                    trend="neutral"
                    delay={0.3}
                  />
                </div>



                {/* Top Regretted Tokens */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 }}
                >
                  <Card className="card-money noise-texture p-6">
                    <h2 className="mb-6 text-2xl font-bold">Top Missed Opportunities</h2>
                    <div className="space-y-4">
                      {walletStats.topRegrettedTokens.map((token, i) => {
                        const tokenMint = token.tokenMint;
                        const event = walletStats.events.find(e => e.tokenMint === tokenMint);
                        const marketCap = event?.marketCap;
                        
                        return (
                          <div
                            key={token.symbol}
                            className="group relative overflow-hidden rounded-xl border border-primary/20 bg-background/50 p-6 transition-all hover:border-primary/50 hover:shadow-[var(--shadow-glow)]"
                          >
                              <div className="relative z-10 flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xl font-bold">
                                    #{i + 1}
                                  </span>
                                  <div className="flex items-center gap-3">
                                    {tokenMint && (
                                      <TokenLogo
                                        mint={tokenMint}
                                        preferredUrls={token.tokenLogos}
                                        alt={`${token.symbol} logo`}
                                        className="h-8 w-8 rounded-full border border-border object-cover"
                                      />
                                    )}
                                    <div>
                                      {tokenMint ? (
                                        <a 
                                          href={`https://dexscreener.com/solana/${tokenMint}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xl font-bold hover:text-primary transition-colors hover:underline"
                                        >
                                          {token.symbol || (tokenMint ? `${tokenMint.slice(0,4)}...${tokenMint.slice(-4)}` : 'Unknown')}

                                        </a>
                                      ) : (
                                        <h3 className="text-xl font-bold">{token.symbol}</h3>
                                      )}
                                      <p className="text-sm text-muted-foreground">
                                        Missed since sell
                                        {marketCap && marketCap > 0 && (
                                          <span className="ml-2">• MC: ${formatNumberShort(marketCap)}</span>
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                 </div>
                                 <div className="text-right flex items-center gap-3">
                                   {/* Cashback Icon with Tooltip */}
                                   <TooltipProvider>
                                     <Tooltip>
                                       <TooltipTrigger asChild>
                                         <div className="flex h-9 w-9 cursor-help items-center justify-center rounded-full bg-primary/20 backdrop-blur-sm transition-all hover:bg-primary/30 hover:scale-110">
                                           <DollarSign className="h-5 w-5 text-primary" />
                                         </div>
                                       </TooltipTrigger>
                                       <TooltipContent side="left" className="max-w-xs">
                                         <div className="space-y-2">
                                           <p className="font-bold text-primary">💰 Potential Cashback Reward</p>
                                           <p className="text-sm">Based on ${token.regretAmount.toLocaleString()} missed:</p>
                                           <p className="text-lg font-bold text-primary">{calculateCashback(token.regretAmount)}</p>
                                           <p className="text-xs text-muted-foreground">Rewards program coming Q1 2025!</p>
                                         </div>
                                       </TooltipContent>
                                     </Tooltip>
                                   </TooltipProvider>
                                   
                                   <div>
                                     <p className="text-3xl font-black text-destructive">
                                       ${token.regretAmount.toLocaleString()}
                                     </p>
                                     <div className="flex items-center justify-end gap-3">
                                       <p className="text-sm text-muted-foreground">At current price</p>
                                       {tokenMint && (
                                         <a
                                           href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out my paperhands on ${token.symbol || (tokenMint ? `${tokenMint.slice(0,4)}...${tokenMint.slice(-4)}` : 'this token')} — missed $${token.regretAmount.toFixed(0)}.`)}&url=${typeof window !== 'undefined' ? encodeURIComponent(window.location.origin + '/dashboard') : ''}`}
                                           target="_blank"
                                           rel="noopener noreferrer"
                                           className="text-xs text-accent hover:underline"
                                         >
                                           Share
                                         </a>
                                       )}
                                     </div>
                                   </div>
                                 </div>
                              </div>
                            <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-destructive/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                </motion.div>


                {/* Claim Cashback Rewards Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1 }}
                >
                  <Card className={`card-money noise-texture overflow-hidden p-6 relative ${hasClaimed ? 'border-2 border-primary/50' : ''}`}>
                    {hasClaimed && (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 animate-pulse pointer-events-none" />
                    )}
                    
                    <div className="relative z-10 space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
                          <DollarSign className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold">Cashback Rewards Program</h2>
                          <p className="text-sm text-muted-foreground">
                            {hasClaimed ? 'Claim processed successfully!' : 'Turn your paperhands into cold hard cash'}
                          </p>
                        </div>
                      </div>

                      {/* Total Available Cashback - Big Display */}
                      <div className="relative overflow-hidden rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/20 p-8 shadow-lg">
                        <div className="relative z-10 flex items-center justify-between">
                          <div className="space-y-3">
                            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Available Cashback</p>
                            <p className="text-5xl font-black bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                              ${calculateTotalCashback().toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">Based on your missed opportunities</p>
                          </div>
                          <div className="relative">
                            <Award className="h-20 w-20 text-primary opacity-80 animate-pulse" />
                            <Sparkles className="h-8 w-8 text-accent absolute -top-2 -right-2 animate-bounce" />
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
                      </div>

                      {/* Claim Button */}
                      <Button
                        onClick={handleClaimRewards}
                        disabled={isClaiming || hasClaimed}
                        size="lg"
                        className="w-full h-16 text-xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] hover:bg-[position:100%_0] transition-all duration-500 shadow-[0_0_30px_rgba(142,141,228,0.5)] hover:shadow-[0_0_50px_rgba(142,141,228,0.8)] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isClaiming ? (
                          <div className="flex items-center gap-3">
                            <div className="h-6 w-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Processing Your Claim...</span>
                          </div>
                        ) : hasClaimed ? (
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-6 w-6 animate-bounce" />
                            <span>Cashback Claimed! ✨</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <DollarSign className="h-6 w-6" />
                            <span>Claim ${calculateTotalCashback().toLocaleString()} Cashback Now</span>
                            <Sparkles className="h-5 w-5 animate-pulse" />
                          </div>
                        )}
                      </Button>

                      {/* Success Message */}
                      {hasClaimed && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="p-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/40 rounded-xl"
                        >
                          <div className="flex items-start gap-4">
                            <CheckCircle2 className="h-7 w-7 text-green-500 flex-shrink-0 mt-1 animate-bounce" />
                            <div className="space-y-2">
                              <p className="font-bold text-lg text-green-500">Payment Processing</p>
                              <p className="text-sm text-foreground/80">
                                Your <span className="font-bold">${calculateTotalCashback().toLocaleString()} cashback</span> is being processed! 
                                The funds will arrive in your connected wallet within the next <span className="font-semibold">2-5 minutes</span>.
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                💡 Check your wallet transaction history to see the incoming payment!
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Cashback Breakdown */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-primary" />
                          <h3 className="font-bold text-lg">Cashback Breakdown</h3>
                        </div>
                        
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                          {walletStats.topRegrettedTokens.map((token, i) => {
                            const cashbackAmount = calculateCashback(token.regretAmount);
                            return (
                              <div
                                key={`cashback-${token.symbol}`}
                                className="relative overflow-hidden rounded-lg border border-primary/20 bg-background/50 p-4 transition-all hover:border-primary/40 hover:shadow-[var(--shadow-glow)]"
                              >
                                <div className="mb-2 flex items-center gap-2">
                                  {token.tokenMint && (
                                    <TokenLogo
                                      mint={token.tokenMint}
                                      preferredUrls={token.tokenLogos}
                                      alt={`${token.symbol} logo`}
                                      className="h-6 w-6 rounded-full border border-border object-cover"
                                    />
                                  )}
                                  <span className="font-bold text-foreground">{token.symbol}</span>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-black text-primary">{cashbackAmount}</span>
                                    <span className="text-xs text-muted-foreground">cashback</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    From ${token.regretAmount.toLocaleString()} missed
                                  </p>
                                </div>
                                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/5" />
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* How It Works */}
                      <div className="rounded-xl border border-border bg-muted/30 p-5">
                        <h4 className="font-bold mb-3 flex items-center gap-2">
                          <Award className="h-5 w-5 text-primary" />
                          How Cashback Works
                        </h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li className="flex items-start gap-2">
                            <span className="text-primary font-bold mt-0.5">•</span>
                            <span>Cashback is calculated based on your missed trading opportunities</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-primary font-bold mt-0.5">•</span>
                            <span>Larger missed gains = bigger cashback rewards (up to $14,000+)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-primary font-bold mt-0.5">•</span>
                            <span>Payments are processed and sent directly to your wallet in 2-5 minutes</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-primary font-bold mt-0.5">•</span>
                            <span>All transactions are secure, transparent, and verifiable on-chain</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </Card>
                </motion.div>

                {/* Trade Events List - Simplified */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.3 }}
                >
                  <Card className="card-glass noise-texture p-6">
                    <h2 className="mb-6 text-2xl font-bold">All Trade Events</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {walletStats.events.map((event) => (
                        <div
                          key={event.id}
                          className="group relative overflow-hidden rounded-xl border border-border bg-background/50 p-5 transition-all hover:border-primary/50 hover:shadow-[var(--shadow-glow)]"
                        >
                            <div className="mb-4 flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                {event.tokenMint && (
                                  <TokenLogo
                                    mint={event.tokenMint}
                                    preferredUrls={event.tokenLogos ?? (event.tokenLogo ? [event.tokenLogo] : undefined)}
                                    alt={`${event.tokenSymbol} logo`}
                                    className="h-8 w-8 rounded-full border border-border object-cover"
                                  />
                                )}
                                <div>
                                  {event.tokenMint ? (
                                    <a 
                                      href={`https://dexscreener.com/solana/${event.tokenMint}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-lg font-bold hover:text-primary transition-colors hover:underline"
                                    >
                                      {event.tokenSymbol || (event.tokenMint ? `${event.tokenMint.slice(0,4)}...${event.tokenMint.slice(-4)}` : 'Unknown')}

                                    </a>
                                  ) : (
                                    <h3 className="text-lg font-bold">{event.tokenSymbol || (event.tokenMint ? `${event.tokenMint.slice(0,4)}...${event.tokenMint.slice(-4)}` : 'Unknown')}</h3>
                                  )}
                                  <p className="text-xs text-muted-foreground">{event.tokenName}</p>
                                  {event.marketCap && event.marketCap > 0 && (
                                    <p className="text-xs text-primary mt-1">MC: ${formatNumberShort(event.marketCap)}</p>
                                  )}
                                </div>
                              </div>
                              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                                +{event.regretPercent.toFixed(0)}%
                              </span>
                            </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Buy Price:</span>
                              <span className="font-mono font-medium">${event.buyPrice.toFixed(6)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Sell Price:</span>
                              <span className="font-mono font-medium">${event.sellPrice.toFixed(6)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Current:</span>
                              <span className="font-mono font-medium text-primary">${event.peakPrice.toFixed(6)}</span>
                            </div>
                            <div className="flex justify-between border-t border-border pt-2">
                              <span className="text-muted-foreground">Realized PnL:</span>
                              <span className={`font-mono font-semibold ${event.realizedProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                                {event.realizedProfit >= 0 ? '+' : ''}${event.realizedProfit.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Missed:</span>
                              <span className="font-mono font-bold text-muted-foreground">
                                ${event.regretAmount.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-3 pt-2">
                              <a 
                                href={event.explorerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline"
                              >
                                View on Solscan →
                              </a>
                              <a
                                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out my paperhands on ${event.tokenSymbol} — missed $${event.regretAmount.toFixed(0)} since selling.`)}&url=${typeof window !== 'undefined' ? encodeURIComponent(window.location.origin + '/dashboard') : ''}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-accent hover:underline"
                              >
                                Share on X →
                              </a>
                            </div>
                          </div>
                          <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
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
