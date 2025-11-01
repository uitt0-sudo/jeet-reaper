"use client";

import { motion } from "framer-motion";
import { Navigation, TopBar } from "@/components/Navigation";
import { Card } from "@/components/ui/card";

const About = () => {
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
            <h1 className="mb-4 text-4xl font-bold">About</h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <Card className="card-glass noise-texture p-8">
              <h2 className="mb-4 text-2xl font-bold">Our Mission</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  paperhands.cc was built to bring transparency and awareness to one of the most
                  common trading mistakes in crypto: selling too early. Every trader has experienced
                  the regret of watching a token moon after they exit.
                </p>
                <p>
                  By quantifying this phenomenon, we aim to help traders make more informed decisions
                  and develop better holding strategies. Whether you're a seasoned degen or new to
                  Solana DeFi, understanding your paperhands patterns can improve your long-term performance.
                </p>
                <p>
                  This tool is designed for educational and entertainment purposes. Past performance
                  doesn't guarantee future results, and no trading strategy is foolproof.
                </p>
              </div>
            </Card>

            <Card className="card-glass noise-texture p-8">
              <h2 className="mb-4 text-2xl font-bold">Privacy Policy</h2>
              <div className="space-y-4 text-sm text-muted-foreground">
                <p>
                  <strong>Data Collection:</strong> We analyze publicly available blockchain data.
                  Wallet addresses and transaction history are public on the Solana blockchain.
                  We do not collect personally identifiable information beyond what's visible on-chain.
                </p>
                <p>
                  <strong>Data Usage:</strong> Wallet data is processed temporarily to calculate
                  paperhands metrics. We may cache aggregate statistics for leaderboards, but we do not
                  sell or share individual wallet data with third parties.
                </p>
                <p>
                  <strong>Cookies:</strong> We use minimal cookies for site functionality and analytics.
                  No tracking cookies are used for advertising purposes.
                </p>
              </div>
            </Card>

            <Card className="card-glass noise-texture p-8">
              <h2 className="mb-4 text-2xl font-bold">Terms of Service</h2>
              <div className="space-y-4 text-sm text-muted-foreground">
                <p>
                  <strong>Use of Service:</strong> paperhands.cc is provided "as is" for informational
                  purposes. We make no guarantees about the accuracy of calculations or availability of the service.
                </p>
                <p>
                  <strong>Not Financial Advice:</strong> Nothing on this site constitutes financial,
                  investment, legal, or tax advice. Cryptocurrency trading involves risk. Do your own research
                  and consult with qualified professionals before making investment decisions.
                </p>
                <p>
                  <strong>Liability:</strong> We are not responsible for any trading decisions made
                  based on information from this site. Use at your own risk.
                </p>
                <p>
                  <strong>Intellectual Property:</strong> All content, design, and code on paperhands.cc
                  is proprietary. Unauthorized reproduction or distribution is prohibited.
                </p>
                <p>
                  <strong>Modifications:</strong> We reserve the right to modify these terms at any time.
                  Continued use of the service constitutes acceptance of updated terms.
                </p>
              </div>
            </Card>

            <Card className="card-glass noise-texture p-8">
              <h2 className="mb-4 text-2xl font-bold">Contact</h2>
              <p className="text-muted-foreground">
                Questions, feedback, or partnership inquiries? Reach out:
              </p>
              <div className="mt-4 space-y-2">
                <p className="text-sm">
                  <strong>Twitter:</strong>{" "}
                  <a
                    href="https://twitter.com/paperhandscc"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    @paperhandscc
                  </a>
                </p>
                <p className="text-sm">
                  <strong>Email:</strong>{" "}
                  <a href="mailto:hello@paperhands.cc" className="text-primary hover:underline">
                    hello@paperhands.cc
                  </a>
                </p>
              </div>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default About;
