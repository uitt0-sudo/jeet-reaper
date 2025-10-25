import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Wallet, Loader2, Sparkles, CheckCircle2, TrendingDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const calculateCashback = (regretAmount: number): string => {
  if (regretAmount < 100) return "$1.40-3.50";
  if (regretAmount < 300) return "$7-21";
  if (regretAmount < 1000) return "$21-70";
  if (regretAmount < 5000) return "$70-350";
  if (regretAmount < 10000) return "$350-700";
  if (regretAmount < 50000) return "$700-3,500";
  if (regretAmount < 100000) return "$3,500-7,000";
  return "$14,000+";
};

export default function Rewards() {
  const [walletAddress, setWalletAddress] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);
  const { toast } = useToast();

  // Mock data for demonstration
  const mockCashbackData = [
    { token: "BONK", regret: 5420.32, cashback: "$379.42" },
    { token: "WIF", regret: 2150.50, cashback: "$150.54" },
    { token: "POPCAT", regret: 890.75, cashback: "$62.35" },
  ];

  const totalCashback = mockCashbackData.reduce((sum, item) => {
    const amount = parseFloat(item.cashback.replace("$", "").replace(",", ""));
    return sum + amount;
  }, 0);

  const handleScanWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress) return;

    setIsScanning(true);
    setScanComplete(false);

    // Simulate scanning
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setIsScanning(false);
    setScanComplete(true);
  };

  const handleClaimRewards = async (currency: "SOL" | "USDC") => {
    setIsClaiming(true);

    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsClaiming(false);
    setHasClaimed(true);

    toast({
      title: "Cashback Claimed! 🎉",
      description: `Your ${totalCashback.toFixed(2)} ${currency} cashback will be sent to your wallet in 2-5 minutes.`,
      duration: 5000,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-center bg-gradient-to-r from-primary via-primary-light to-primary bg-clip-text text-transparent">
            Paperhands Cashback
          </h1>
          <p className="text-xl text-muted-foreground mb-12 text-center max-w-2xl mx-auto">
            Turn your trading regrets into real rewards. Enter your wallet to see your cashback.
          </p>

          {/* Wallet Input Section */}
          {!scanComplete && (
            <Card className="bg-card/50 backdrop-blur-xl border-primary/20 mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-primary" />
                  Enter Your Wallet Address
                </CardTitle>
                <CardDescription>
                  We'll scan your transaction history to calculate your cashback rewards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleScanWallet} className="space-y-4">
                  <Input
                    type="text"
                    placeholder="Your Solana wallet address..."
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    className="bg-background/50 h-12"
                    required
                    disabled={isScanning}
                  />
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-lg"
                    disabled={isScanning || !walletAddress}
                  >
                    {isScanning ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Scanning Wallet...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Scan for Rewards
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
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
              className="space-y-6"
            >
              {/* Total Cashback Card */}
              <Card className="bg-gradient-to-br from-primary/20 via-primary/10 to-background border-primary/30 overflow-hidden relative">
                <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
                <CardHeader className="text-center pb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                    className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4"
                  >
                    <DollarSign className="w-10 h-10 text-primary" />
                  </motion.div>
                  <CardTitle className="text-3xl mb-2">Your Cashback Reward</CardTitle>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-5xl md:text-7xl font-bold text-primary"
                  >
                    ${totalCashback.toFixed(2)}
                  </motion.div>
                  <CardDescription className="text-base mt-4">
                    Based on your paperhands trading history
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Breakdown */}
              <Card className="bg-card/50 backdrop-blur-xl border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-primary" />
                    Cashback Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {mockCashbackData.map((item, index) => (
                    <motion.div
                      key={item.token}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex items-center justify-between p-4 bg-background/50 rounded-lg border border-primary/10"
                    >
                      <div>
                        <div className="font-semibold">{item.token}</div>
                        <div className="text-sm text-muted-foreground">
                          Missed: ${item.regret.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-xl font-bold text-primary">
                        {item.cashback}
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
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
                  {hasClaimed ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-primary/10 border border-primary/30 rounded-lg p-6 text-center"
                    >
                      <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-3" />
                      <h3 className="text-xl font-bold mb-2">Cashback Claimed!</h3>
                      <p className="text-muted-foreground">
                        Your rewards will arrive in your wallet within 2-5 minutes.
                      </p>
                    </motion.div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      <Button
                        size="lg"
                        onClick={() => handleClaimRewards("SOL")}
                        disabled={isClaiming}
                        className="h-16 text-lg"
                      >
                        {isClaiming ? (
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
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => handleClaimRewards("USDC")}
                        disabled={isClaiming}
                        className="h-16 text-lg"
                      >
                        {isClaiming ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <DollarSign className="w-5 h-5 mr-2" />
                            Claim in USDC
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                  
                  {!hasClaimed && (
                    <p className="text-sm text-muted-foreground text-center pt-2">
                      💡 Cashback will be sent to your wallet in 2-5 minutes after claiming
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
                    setHasClaimed(false);
                    setWalletAddress("");
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
