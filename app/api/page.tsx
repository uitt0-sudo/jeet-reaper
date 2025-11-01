"use client";

import { motion } from "framer-motion";
import { Navigation, TopBar } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ApiDocs = () => {
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
            <h1 className="mb-4 text-4xl font-bold">API Documentation</h1>
            <p className="text-lg text-muted-foreground">
              Mock endpoints for integrating paperhands.cc into your applications
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {/* Base URL */}
            <Card className="card-glass noise-texture p-6">
              <h2 className="mb-4 text-xl font-bold">Base URL</h2>
              <div className="rounded bg-secondary p-3 font-mono text-sm">
                https://api.paperhands.cc/v1
              </div>
            </Card>

            {/* Analyze Endpoint */}
            <Card className="card-glass noise-texture p-6">
              <div className="mb-4 flex items-center space-x-3">
                <Badge className="bg-primary text-primary-foreground">POST</Badge>
                <h2 className="text-xl font-bold">/analyze</h2>
              </div>
              
              <p className="mb-4 text-muted-foreground">Analyze a wallet for paperhands events</p>

              <h3 className="mb-2 font-semibold">Request Body:</h3>
              <div className="mb-4 overflow-x-auto rounded bg-secondary p-4 font-mono text-sm">
                <pre>{JSON.stringify({
                  address: "9xK2...7nL4",
                  timeframe: 90 // days
                }, null, 2)}</pre>
              </div>

              <h3 className="mb-2 font-semibold">Response:</h3>
              <div className="overflow-x-auto rounded bg-secondary p-4 font-mono text-xs">
                <pre>{JSON.stringify({
                  address: "9xK2...7nL4",
                  paperhandsScore: 89,
                  totalRegret: 487650,
                  totalRegretPercent: 892,
                  worstLoss: 171000,
                  totalEvents: 12,
                  avgHoldTime: 35,
                  avgShouldaHoldTime: 120,
                  events: [
                    {
                      id: "evt_001",
                      tokenSymbol: "WIF",
                      buyPrice: 0.12,
                      sellPrice: 0.45,
                      peakPrice: 3.87,
                      regretAmount: 171000,
                      regretPercent: 1037,
                      sellDate: "2024-02-20",
                      txHash: "5fG8...9Kj2"
                    }
                  ]
                }, null, 2)}</pre>
              </div>
            </Card>

            {/* Leaderboard Endpoint */}
            <Card className="card-glass noise-texture p-6">
              <div className="mb-4 flex items-center space-x-3">
                <Badge variant="secondary">GET</Badge>
                <h2 className="text-xl font-bold">/leaderboard</h2>
              </div>
              
              <p className="mb-4 text-muted-foreground">Fetch the paperhands leaderboard</p>

              <h3 className="mb-2 font-semibold">Query Parameters:</h3>
              <div className="mb-4 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <code className="rounded bg-secondary px-2 py-1">limit</code>
                  <span className="text-muted-foreground">Number of entries (default: 50)</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="rounded bg-secondary px-2 py-1">sortBy</code>
                  <span className="text-muted-foreground">rank | totalRegret | regretPercent</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="rounded bg-secondary px-2 py-1">timeframe</code>
                  <span className="text-muted-foreground">24h | 7d | 30d | all (default: all)</span>
                </div>
              </div>

              <h3 className="mb-2 font-semibold">Response:</h3>
              <div className="overflow-x-auto rounded bg-secondary p-4 font-mono text-xs">
                <pre>{JSON.stringify({
                  count: 8,
                  entries: [
                    {
                      rank: 1,
                      address: "9xK2...7nL4",
                      ensName: "cryptojeet.eth",
                      totalRegret: 487650,
                      regretPercent: 892,
                      paperhandsScore: 89,
                      totalEvents: 12
                    }
                  ]
                }, null, 2)}</pre>
              </div>
            </Card>

            {/* Wallet Endpoint */}
            <Card className="card-glass noise-texture p-6">
              <div className="mb-4 flex items-center space-x-3">
                <Badge variant="secondary">GET</Badge>
                <h2 className="text-xl font-bold">/wallet/:address</h2>
              </div>
              
              <p className="mb-4 text-muted-foreground">Get detailed stats for a specific wallet</p>

              <h3 className="mb-2 font-semibold">Response:</h3>
              <div className="overflow-x-auto rounded bg-secondary p-4 font-mono text-xs">
                <pre>{JSON.stringify({
                  address: "9xK2...7nL4",
                  ensName: "cryptojeet.eth",
                  paperhandsScore: 89,
                  totalRegret: 487650,
                  worstLoss: 171000,
                  winRate: 60,
                  lossRate: 40,
                  topRegrettedTokens: [
                    { symbol: "WIF", regretAmount: 171000 },
                    { symbol: "PEPE", regretAmount: 120000 }
                  ]
                }, null, 2)}</pre>
              </div>
            </Card>

            {/* Rate Limits */}
            <Card className="card-glass noise-texture p-6">
              <h2 className="mb-4 text-xl font-bold">Rate Limits</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between rounded bg-secondary p-3">
                  <span>Free tier:</span>
                  <span className="font-mono">100 requests/hour</span>
                </div>
                <div className="flex items-center justify-between rounded bg-secondary p-3">
                  <span>Pro tier:</span>
                  <span className="font-mono">1,000 requests/hour</span>
                </div>
                <div className="flex items-center justify-between rounded bg-secondary p-3">
                  <span>Enterprise:</span>
                  <span className="font-mono">Unlimited</span>
                </div>
              </div>
            </Card>

            {/* Error Responses */}
            <Card className="card-glass noise-texture p-6">
              <h2 className="mb-4 text-xl font-bold">Error Responses</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 font-semibold">400 Bad Request</h3>
                  <div className="rounded bg-secondary p-3 font-mono text-xs">
                    <pre>{JSON.stringify({
                      error: "Invalid wallet address format",
                      code: "INVALID_ADDRESS"
                    }, null, 2)}</pre>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 font-semibold">429 Too Many Requests</h3>
                  <div className="rounded bg-secondary p-3 font-mono text-xs">
                    <pre>{JSON.stringify({
                      error: "Rate limit exceeded",
                      retryAfter: 3600
                    }, null, 2)}</pre>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 font-semibold">404 Not Found</h3>
                  <div className="rounded bg-secondary p-3 font-mono text-xs">
                    <pre>{JSON.stringify({
                      error: "Wallet not found or has no trading history",
                      code: "WALLET_NOT_FOUND"
                    }, null, 2)}</pre>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default ApiDocs;
