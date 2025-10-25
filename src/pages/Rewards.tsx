import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Wallet, Loader2, Sparkles, CheckCircle2, Gift, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Rewards() {
  const [walletAddress, setWalletAddress] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);
  const { toast } = useToast();

  // Mock data for demonstration - randomize between $20-$100
  const generateRandomCashback = () => {
    const min = 20;
    const max = 100;
    return (Math.random() * (max - min) + min).toFixed(2);
  };

  const mockCashbackData = [
    { token: "BONK", regret: 5420.32, cashback: `$${generateRandomCashback()}` },
    { token: "WIF", regret: 2150.50, cashback: `$${generateRandomCashback()}` },
    { token: "POPCAT", regret: 890.75, cashback: `$${generateRandomCashback()}` },
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
                          Claim in SOL or USDC directly to your wallet
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
                      className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-primary via-primary-light to-primary bg-clip-text text-transparent mb-4"
                    >
                      ${totalCashback.toFixed(2)}
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <CardDescription className="text-base text-muted-foreground/80 max-w-2xl mx-auto">
                        Based on your paperhands trading history
                      </CardDescription>
                      <CardDescription className="text-sm text-muted-foreground/60 max-w-2xl mx-auto mt-3 italic">
                        * Amount varies based on token price, dynamic fees, and token volume. This is not everything.
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
