import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Wallet, Loader2, Sparkles, CheckCircle2, Gift, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  claimCashback,
  fetchTokenHoldings,
  generateRandomReward,
  getRewardStatus,
  MINIMUM_HOLDING,
  syncWalletHolder,
  type RewardStatus,
} from "@/lib/rewards";
import { CASHBACK_PERCENTAGE, RANDOM_REWARD_RANGE } from "@/config/rewards";

export default function Rewards() {
  const [walletAddress, setWalletAddress] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [tokenHoldings, setTokenHoldings] = useState<number | null>(null);
  const [rewardStatus, setRewardStatus] = useState<RewardStatus | null>(null);
  const [isRandomRewardLoading, setIsRandomRewardLoading] = useState(false);
  const [isCashbackLoading, setIsCashbackLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const { toast } = useToast();
  const tokenSymbol = import.meta.env.VITE_TOKEN_SYMBOL ?? "TOKEN";

  const handleScanWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedAddress = walletAddress.trim();
    if (!trimmedAddress) return;

    setIsScanning(true);
    setScanError(null);
    setScanComplete(false);
    setRewardStatus(null);
    setTokenHoldings(null);

    try {
      const holdings = await fetchTokenHoldings(trimmedAddress);
      await syncWalletHolder(trimmedAddress, holdings);
      const status = await getRewardStatus(trimmedAddress);

      setTokenHoldings(holdings);
      setRewardStatus(status);
      setScanComplete(true);

      const holdingsText = holdings.toLocaleString(undefined, {
        maximumFractionDigits: 2,
      });

      toast({
        title: "Wallet scanned",
        description:
          holdings >= MINIMUM_HOLDING
            ? `Detected ${holdingsText} ${tokenSymbol} tokens. You are eligible for cashback.`
            : `Detected ${holdingsText} ${tokenSymbol} tokens. Minimum ${MINIMUM_HOLDING.toLocaleString()} ${tokenSymbol} required for cashback.`,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to scan wallet. Please try again.";
      setScanError(message);
      toast({
        title: "Scan failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleRandomReward = async () => {
    const trimmedAddress = walletAddress.trim();
    if (!trimmedAddress) {
      return;
    }

    setIsRandomRewardLoading(true);

    try {
      const result = await generateRandomReward(trimmedAddress);

      if (!result) {
        const refreshedStatus = await getRewardStatus(trimmedAddress);
        setRewardStatus(refreshedStatus);

        toast({
          title: "No random reward available",
          description: "This wallet has already received its random reward.",
          variant: "destructive",
        });
        return;
      }

      setRewardStatus(result.status);
      const updatedHoldings = result.status.holder?.holdings;
      if (typeof updatedHoldings === "number") {
        setTokenHoldings(updatedHoldings);
      }

      toast({
        title: "Random Reward Sent! 🎁",
        description: `You won ${result.amount.toFixed(
          2
        )} ${tokenSymbol}. It will be transferred to your wallet shortly.`,
        duration: 5000,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to process random reward.";
      toast({
        title: "Random reward failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsRandomRewardLoading(false);
    }
  };

  const currentHoldings =
    typeof tokenHoldings === "number"
      ? tokenHoldings
      : rewardStatus?.holder?.holdings ?? 0;
  const potentialCashback = Number(
    Math.max(0, currentHoldings * CASHBACK_PERCENTAGE).toFixed(2)
  );
  const cashbackClaimed = Boolean(rewardStatus?.cashback);
  const randomRewardClaimed = Boolean(rewardStatus?.randomReward);
  const claimedCashbackAmount = rewardStatus?.cashback?.amount ?? 0;
  const claimedCashbackDate = rewardStatus?.cashback?.claimed_at ?? null;
  const claimedRandomRewardAmount = rewardStatus?.randomReward?.amount ?? 0;
  const claimedRandomRewardDate =
    rewardStatus?.randomReward?.claimed_at ?? null;
  const isCashbackEligible = currentHoldings >= MINIMUM_HOLDING;
  const holdingsText = currentHoldings.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
  const potentialCashbackText = potentialCashback.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
  const minimumHoldingText = MINIMUM_HOLDING.toLocaleString();

  const handleClaimRewards = async (currency: "SOL" | "USDC") => {
    const trimmedAddress = walletAddress.trim();
    if (!trimmedAddress || tokenHoldings === null) {
      return;
    }

    if (tokenHoldings < MINIMUM_HOLDING) {
      toast({
        title: "Not eligible yet",
        description: `You need at least ${MINIMUM_HOLDING.toLocaleString()} ${tokenSymbol} to claim cashback.`,
        variant: "destructive",
      });
      return;
    }

    setIsCashbackLoading(true);

    try {
      const result = await claimCashback(trimmedAddress, tokenHoldings);

      if (!result) {
        const refreshedStatus = await getRewardStatus(trimmedAddress);
        setRewardStatus(refreshedStatus);

        toast({
          title: "Cashback unavailable",
          description:
            refreshedStatus.cashback
              ? "Cashback has already been claimed for this wallet."
              : "Unable to process cashback claim. Please try again shortly.",
          variant: "destructive",
        });
        return;
      }

      setRewardStatus(result.status);
      const updatedHoldings = result.status.holder?.holdings;
      if (typeof updatedHoldings === "number") {
        setTokenHoldings(updatedHoldings);
      }

      toast({
        title: "Cashback Claimed! 🎉",
        description: `You claimed ${result.amount.toFixed(
          2
        )} ${tokenSymbol}. It will be sent to your wallet in 2-5 minutes.`,
        duration: 5000,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to process cashback claim.";
      toast({
        title: "Cashback failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsCashbackLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
      </div>
      
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-12"
        >
          {/* Hero Section */}
          {!scanComplete && (
            <>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center mb-12"
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/30 via-primary/20 to-transparent flex items-center justify-center backdrop-blur-xl border border-primary/20"
                >
                  <Gift className="w-12 h-12 text-primary" />
                </motion.div>
                
                <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-primary-light to-primary bg-clip-text text-transparent">
                  Paperhands Cashback
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-2xl mx-auto">
                  Turn your trading regrets into real rewards
                </p>
                <p className="text-lg text-muted-foreground/70 max-w-xl mx-auto">
                  Enter your wallet address to discover your claimable cashback
                </p>
              </motion.div>

              {/* Wallet Input Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-gradient-to-br from-card/80 via-card/60 to-card/80 backdrop-blur-2xl border-primary/30 shadow-2xl shadow-primary/10 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
                  <CardHeader className="text-center space-y-2 relative">
                    <CardTitle className="text-2xl md:text-3xl flex items-center justify-center gap-3">
                      <Wallet className="w-7 h-7 text-primary" />
                      Enter Your Wallet
                    </CardTitle>
                    <CardDescription className="text-base">
                      We'll analyze your transaction history to calculate your cashback rewards
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="relative">
                    <form onSubmit={handleScanWallet} className="space-y-5">
                      <div className="relative">
                        <Input
                          type="text"
                          placeholder="Your Solana wallet address..."
                          value={walletAddress}
                          onChange={(e) => setWalletAddress(e.target.value)}
                          className="bg-background/80 backdrop-blur-sm h-14 text-base border-primary/20 focus:border-primary/40 transition-all"
                          required
                          disabled={isScanning}
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-primary-light hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                        disabled={isScanning || !walletAddress}
                      >
                        {isScanning ? (
                          <>
                            <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                            Scanning Wallet...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-6 h-6 mr-2" />
                            Scan for Cashback
                          </>
                        )}
                      </Button>
                    </form>
                    {scanError && (
                      <p className="text-sm text-destructive text-center pt-2">
                        {scanError}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Feature Cards */}
                <div className="grid md:grid-cols-3 gap-4 mt-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Card className="bg-card/40 backdrop-blur-xl border-primary/10 h-full">
                      <CardContent className="pt-6 text-center">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                          <Zap className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="font-semibold mb-2">Instant Analysis</h3>
                        <p className="text-sm text-muted-foreground">
                          Get your cashback calculated in seconds
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Card className="bg-card/40 backdrop-blur-xl border-primary/10 h-full">
                      <CardContent className="pt-6 text-center">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                          <DollarSign className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="font-semibold mb-2">Real Rewards</h3>
                        <p className="text-sm text-muted-foreground">
                          Claim in SOL directly to your wallet
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Card className="bg-card/40 backdrop-blur-xl border-primary/10 h-full">
                      <CardContent className="pt-6 text-center">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                          <CheckCircle2 className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="font-semibold mb-2">Fast Delivery</h3>
                        <p className="text-sm text-muted-foreground">
                          Receive your cashback in 2-5 minutes
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              </motion.div>
            </>
          )}

          {/* Scanning Animation */}
          <AnimatePresence>
            {isScanning && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
              >
                <Card className="max-w-md w-full mx-4 bg-card/90 border-primary/30">
                  <CardContent className="pt-12 pb-12 text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-20 h-20 mx-auto mb-6 rounded-full border-4 border-primary border-t-transparent"
                    />
                    <h3 className="text-2xl font-bold mb-2">Scanning Your Wallet</h3>
                    <p className="text-muted-foreground mb-4">
                      Analyzing your transaction history...
                    </p>
                    <div className="space-y-2 text-sm text-left max-w-xs mx-auto">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        <span>Fetching transactions...</span>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1 }}
                        className="flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        <span>Calculating missed gains...</span>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.5 }}
                        className="flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        <span>Computing cashback rewards...</span>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results Section */}
          {scanComplete && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Total Cashback Card */}
              <Card className="bg-gradient-to-br from-primary/20 via-primary/10 to-background border-primary/30 overflow-hidden relative shadow-2xl shadow-primary/20">
                <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
                
                <CardHeader className="text-center pb-12 pt-12 relative">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
                    className="w-28 h-28 rounded-full bg-gradient-to-br from-primary/40 via-primary/30 to-primary/20 flex items-center justify-center mx-auto mb-6 backdrop-blur-xl border-2 border-primary/30 shadow-lg"
                  >
                    <DollarSign className="w-14 h-14 text-primary" />
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <CardTitle className="text-2xl md:text-3xl mb-4 text-muted-foreground font-medium">
                      Your Claimable Cashback
                    </CardTitle>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3, type: "spring", bounce: 0.4 }}
                      className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-primary-light to-primary bg-clip-text text-transparent mb-4"
                    >
                      {potentialCashbackText} {tokenSymbol}
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <CardDescription className="text-base text-muted-foreground/80 max-w-2xl mx-auto">
                        Holdings detected: {holdingsText} {tokenSymbol}
                      </CardDescription>
                      <CardDescription className="text-sm text-muted-foreground/60 max-w-2xl mx-auto mt-3 italic">
                        {isCashbackEligible
                          ? `Cashback rate: ${(CASHBACK_PERCENTAGE * 100).toFixed(
                              1
                            )}% of your holdings.`
                          : `Minimum holding required: ${minimumHoldingText} ${tokenSymbol} to claim cashback.`}
                      </CardDescription>
                    </motion.div>
                  </motion.div>
                </CardHeader>
              </Card>

              {/* Claim Section */}
              <Card className="bg-card/50 backdrop-blur-xl border-primary/20">
                <CardHeader>
                  <CardTitle>Claim Your Cashback</CardTitle>
                  <CardDescription>
                    Choose your preferred currency to receive your rewards
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cashbackClaimed ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-primary/10 border border-primary/30 rounded-lg p-6 text-center"
                    >
                      <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-3" />
                      <h3 className="text-xl font-bold mb-2">Cashback Claimed!</h3>
                      <p className="text-muted-foreground">
                        You claimed {claimedCashbackAmount.toFixed(2)} {tokenSymbol}.{" "}
                        {claimedCashbackDate
                          ? `Claimed at ${new Date(
                              claimedCashbackDate
                            ).toLocaleString()}.`
                          : "Your rewards will arrive in your wallet shortly."}
                      </p>
                    </motion.div>
                  ) : (
                    <>
                      {!isCashbackEligible && (
                        <div className="rounded-lg border border-border bg-muted/10 p-4 text-sm text-muted-foreground">
                          Hold at least {minimumHoldingText} {tokenSymbol} to become eligible for cashback.
                        </div>
                      )}
                      <div className="grid md:grid-cols-2 gap-4">
                        <Button
                          size="lg"
                          onClick={() => handleClaimRewards("SOL")}
                          disabled={isCashbackLoading || !isCashbackEligible}
                          className="h-16 text-lg"
                        >
                          {isCashbackLoading ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <DollarSign className="w-5 h-5 mr-2" />
                              Claim in SOL
                            </>
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                  
                  {!cashbackClaimed && (
                    <p className="text-sm text-muted-foreground text-center pt-2">
                      💡 Cashback will be sent to your wallet in 2-5 minutes after claiming
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Random Reward Section */}
              <Card className="bg-card/50 backdrop-blur-xl border-primary/20">
                <CardHeader>
                  <CardTitle>Random Reward Drop</CardTitle>
                  <CardDescription>
                    Eligible wallets can receive a surprise reward between{" "}
                    {RANDOM_REWARD_RANGE.min} and {RANDOM_REWARD_RANGE.max}{" "}
                    {tokenSymbol}.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {randomRewardClaimed ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-primary/10 border border-primary/30 rounded-lg p-6 text-center"
                    >
                      <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-3" />
                      <h3 className="text-xl font-bold mb-2">
                        Random Reward Claimed!
                      </h3>
                      <p className="text-muted-foreground">
                        You received {claimedRandomRewardAmount.toFixed(2)}{" "}
                        {tokenSymbol}.{" "}
                        {claimedRandomRewardDate
                          ? `Sent at ${new Date(
                              claimedRandomRewardDate
                            ).toLocaleString()}.`
                          : "It will arrive shortly."}
                      </p>
                    </motion.div>
                  ) : (
                    <Button
                      size="lg"
                      onClick={handleRandomReward}
                      disabled={isRandomRewardLoading}
                      className="h-16 text-lg"
                    >
                      {isRandomRewardLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Choosing a wallet...
                        </>
                      ) : (
                        <>
                          <Gift className="w-5 h-5 mr-2" />
                          Reveal My Random Reward
                        </>
                      )}
                    </Button>
                  )}
                  {!randomRewardClaimed && (
                    <p className="text-sm text-muted-foreground text-center pt-2">
                      🎲 Rewards are distributed to random leaderboard wallets that
                      have not yet received a drop.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Reset Button */}
              <div className="text-center">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setScanComplete(false);
                    setRewardStatus(null);
                    setTokenHoldings(null);
                    setWalletAddress("");
                    setScanError(null);
                    setIsCashbackLoading(false);
                    setIsRandomRewardLoading(false);
                  }}
                  className="text-muted-foreground"
                >
                  Scan Another Wallet
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
