import { useState } from "react";
import { motion } from "framer-motion";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift, Sparkles, TrendingUp, Users, Trophy, Zap, Clock, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Rewards() {
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const handleNotifyMe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast({
        title: "You're on the list! 🎉",
        description: "We'll notify you when rewards go live.",
      });
      setEmail("");
    }
  };

  const upcomingRewards = [
    {
      icon: Trophy,
      title: "Paperhands Leaderboard Prizes",
      description: "Top 10 biggest paperhands get exclusive NFT badges",
      status: "Coming Q1 2025",
    },
    {
      icon: Sparkles,
      title: "Share & Earn",
      description: "Earn tokens for sharing your paperhands moments on Twitter",
      status: "Coming Q1 2025",
    },
    {
      icon: Users,
      title: "Referral Program",
      description: "Get rewards for every friend you bring to paperhands.cc",
      status: "Coming Q2 2025",
    },
    {
      icon: TrendingUp,
      title: "Trading Challenges",
      description: "Monthly challenges with crypto prizes for the boldest traders",
      status: "Coming Q2 2025",
    },
    {
      icon: Zap,
      title: "Early Bird Multipliers",
      description: "First 1000 users get 2x rewards when the program launches",
      status: "Limited Spots",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16 mt-8"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6 border border-primary/20">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">Rewards Program Coming Soon</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-primary-light to-primary bg-clip-text text-transparent">
            Turn Your Paperhands
            <br />Into Rewards
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Soon you'll earn crypto rewards for sharing your biggest regrets.
            Because if you're gonna be a jeet, at least get paid for it.
          </p>

          {/* Email Signup */}
          <Card className="max-w-md mx-auto bg-card/50 backdrop-blur-xl border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-center">
                <Gift className="w-5 h-5 text-primary" />
                Get Early Access
              </CardTitle>
              <CardDescription>
                Be the first to know when rewards launch
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleNotifyMe} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background/50"
                  required
                />
                <Button type="submit" className="whitespace-nowrap">
                  Notify Me
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Rewards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold mb-8 text-center">What's Coming</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingRewards.map((reward, index) => (
              <motion.div
                key={reward.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card className="h-full bg-card/50 backdrop-blur-xl border-primary/10 hover:border-primary/30 transition-all group">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <reward.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{reward.title}</CardTitle>
                    <CardDescription>{reward.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                      {reward.status}
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* How It Works - Teaser */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-16"
        >
          <Card className="bg-gradient-to-br from-primary/5 via-background to-background border-primary/20 overflow-hidden relative">
            <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-3xl mb-4">How Rewards Will Work</CardTitle>
              <CardDescription className="text-lg">
                Simple: The bigger your paperhands, the bigger your rewards
              </CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-8 pb-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <h3 className="font-semibold mb-2">Analyze Your Wallet</h3>
                <p className="text-sm text-muted-foreground">
                  Connect your wallet and let us calculate your paperhands score
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <h3 className="font-semibold mb-2">Share Your Regrets</h3>
                <p className="text-sm text-muted-foreground">
                  Tweet your worst paperhands moments with our custom cards
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <h3 className="font-semibold mb-2">Earn Rewards</h3>
                <p className="text-sm text-muted-foreground">
                  Get tokens, NFTs, and exclusive perks based on your score
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* FAQ Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold mb-8 text-center">FAQs</h2>
          
          <div className="space-y-4 max-w-3xl mx-auto">
            <Card className="bg-card/50 backdrop-blur-xl border-primary/10">
              <CardHeader>
                <CardTitle className="text-lg">When will rewards launch?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We're targeting Q1 2025 for the initial rewards program. Sign up above to get notified when we go live.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 backdrop-blur-xl border-primary/10">
              <CardHeader>
                <CardTitle className="text-lg">What kind of rewards will there be?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  You'll earn platform tokens for sharing paperhands moments, exclusive NFT badges for leaderboard positions, and referral bonuses for bringing in new users.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 backdrop-blur-xl border-primary/10">
              <CardHeader>
                <CardTitle className="text-lg">Do I need to pay to participate?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Nope! The rewards program is completely free. You just need a Solana wallet with transaction history.
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-primary/20 max-w-2xl mx-auto">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <Lock className="w-8 h-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl">Early Birds Get the Worm</CardTitle>
              <CardDescription className="text-base">
                First 1,000 users get 2x reward multipliers when the program launches.
                Don't miss out—analyze your wallet now to secure your spot.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="lg" className="px-8" onClick={() => window.location.href = '/dashboard'}>
                Analyze My Wallet Now
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
