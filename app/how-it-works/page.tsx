"use client";

import { motion } from "framer-motion";
import { Navigation, TopBar } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { TrendingDown, Calculator, Target, LineChart } from "lucide-react";

const HowItWorks = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <TopBar />
      
      <main className="ml-64 mt-16 p-8">
        <div className="mx-auto max-w-4xl space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="mb-4 text-4xl font-bold">How It Works</h1>
            <p className="text-lg text-muted-foreground">
              Understanding the paperhands phenomenon and how we calculate your regret metrics
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <Card className="card-glass noise-texture p-8">
              <div className="mb-6 flex items-center space-x-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                  <TrendingDown className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">What Are Paperhands?</h2>
              </div>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  In crypto trading, "paperhands" refers to traders who sell their positions too
                  early, missing out on substantial gains. It's the opposite of "diamond hands" –
                  those who hold through volatility.
                </p>
                <p>
                  This tool analyzes your Solana wallet to identify instances where you sold a token,
                  only to watch it moon afterwards. We calculate exactly how much profit you left on
                  the table.
                </p>
              </div>
            </Card>

            <Card className="card-glass noise-texture p-8">
              <div className="mb-6 flex items-center space-x-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                  <Calculator className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">How We Calculate Regret</h2>
              </div>
              <div className="space-y-6">
                <div className="rounded-lg border border-border bg-background/50 p-4">
                  <h3 className="mb-2 font-semibold text-primary">Step 1: Identify Exits</h3>
                  <p className="text-muted-foreground">
                    We scan your wallet for all token sales on Solana DEXs (Raydium, Orca, Jupiter).
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-background/50 p-4">
                  <h3 className="mb-2 font-semibold text-primary">Step 2: Track Peak Price</h3>
                  <p className="text-muted-foreground">
                    For each sale, we track the token's peak price within 90 days after your exit.
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-background/50 p-4">
                  <h3 className="mb-2 font-semibold text-primary">Step 3: Calculate Delta</h3>
                  <p className="text-muted-foreground">
                    We compute the difference between what you made and what you could have made:
                  </p>
                  <div className="mt-3 rounded bg-secondary p-3 font-mono text-sm">
                    <div>Regret = (Peak Price - Sell Price) × Amount</div>
                    <div className="mt-1">Regret % = ((Peak Price / Sell Price) - 1) × 100</div>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-background/50 p-4">
                  <h3 className="mb-2 font-semibold text-primary">Step 4: Aggregate Metrics</h3>
                  <p className="text-muted-foreground">
                    We sum up all your paperhands events to generate your total regret, worst loss,
                    and paperhands score.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="card-glass noise-texture p-8">
              <div className="mb-6 flex items-center space-x-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">The Paperhands Score</h2>
              </div>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Your paperhands score is a composite metric that reflects the severity of your early
                  exits relative to your realized gains:
                </p>
                <div className="rounded bg-secondary p-4 font-mono text-sm">
                  Score = min((Total Regret / Total Realized Profit) × 10, 100)
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-success/50 bg-success/5 p-4">
                    <p className="font-semibold text-success">0-30: Diamond Hands</p>
                    <p className="text-sm text-muted-foreground">You know when to hold</p>
                  </div>
                  <div className="rounded-lg border border-primary/50 bg-primary/5 p-4">
                    <p className="font-semibold text-primary">31-60: Average Jeet</p>
                    <p className="text-sm text-muted-foreground">Room for improvement</p>
                  </div>
                  <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
                    <p className="font-semibold text-destructive">61-100: Pure Paperhands</p>
                    <p className="text-sm text-muted-foreground">NGMI status</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="card-glass noise-texture p-8">
              <div className="mb-6 flex items-center space-x-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                  <LineChart className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Example Calculation</h2>
              </div>
              <div className="space-y-4">
                <div className="rounded-lg bg-secondary p-4">
                  <p className="mb-3 font-semibold">Scenario: WIF Trade</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bought at:</span>
                      <span className="font-mono">$0.12</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-mono">50,000 WIF</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sold at:</span>
                      <span className="font-mono">$0.45</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-success">Realized profit:</span>
                      <span className="font-mono text-success">$16,500</span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-2">
                      <span className="text-muted-foreground">Peak price (after):</span>
                      <span className="font-mono">$3.87</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-destructive">Unrealized profit:</span>
                      <span className="font-mono text-destructive">$187,500</span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-2 font-bold">
                      <span className="text-destructive">Your regret:</span>
                      <span className="font-mono text-lg text-destructive">$171,000 (1,037%)</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm italic text-muted-foreground">
                  This is a typical paperhands moment – sold for 3x, missed out on 32x.
                </p>
              </div>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default HowItWorks;
