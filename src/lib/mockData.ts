import { WalletStats, LeaderboardEntry, PaperhandsEvent, TokenStats } from "@/types/paperhands";

export const MOCK_TOKENS = [
  { symbol: "WIF", name: "dogwifhat", address: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm" },
  { symbol: "PEPE", name: "Pepe", address: "PEPExxxxx..." },
  { symbol: "BONK", name: "Bonk", address: "BONKxxxxx..." },
  { symbol: "CHILLGUY", name: "Just a chill guy", address: "CHILLxxxx..." },
  { symbol: "POPCAT", name: "Popcat", address: "POPCATxxx..." },
  { symbol: "MEW", name: "cat in a dogs world", address: "MEWxxxxxx..." },
];

export const generateMockEvents = (address: string): PaperhandsEvent[] => {
  const events: PaperhandsEvent[] = [
    {
      id: `${address}-1`,
      tokenSymbol: "WIF",
      tokenName: "dogwifhat",
      buyPrice: 0.12,
      sellPrice: 0.45,
      buyDate: "2024-01-15",
      sellDate: "2024-02-20",
      amount: 50000,
      realizedProfit: 16500,
      unrealizedProfit: 187500,
      regretAmount: 171000,
      regretPercent: 1037,
      peakPrice: 3.87,
      txHash: "5fG8...9Kj2",
      explorerUrl: "https://solscan.io/tx/5fG8...9Kj2",
    },
    {
      id: `${address}-2`,
      tokenSymbol: "PEPE",
      tokenName: "Pepe",
      buyPrice: 0.000008,
      sellPrice: 0.000015,
      buyDate: "2024-03-10",
      sellDate: "2024-04-05",
      amount: 10000000000,
      realizedProfit: 70000,
      unrealizedProfit: 190000,
      regretAmount: 120000,
      regretPercent: 171,
      peakPrice: 0.000027,
      txHash: "7hR3...2Lp9",
      explorerUrl: "https://solscan.io/tx/7hR3...2Lp9",
    },
    {
      id: `${address}-3`,
      tokenSymbol: "BONK",
      tokenName: "Bonk",
      buyPrice: 0.00001,
      sellPrice: 0.000018,
      buyDate: "2024-02-01",
      sellDate: "2024-03-15",
      amount: 5000000000,
      realizedProfit: 40000,
      unrealizedProfit: 125000,
      regretAmount: 85000,
      regretPercent: 213,
      peakPrice: 0.000035,
      txHash: "9mN1...4Qr7",
      explorerUrl: "https://solscan.io/tx/9mN1...4Qr7",
    },
    {
      id: `${address}-4`,
      tokenSymbol: "CHILLGUY",
      tokenName: "Just a chill guy",
      buyPrice: 0.03,
      sellPrice: 0.08,
      buyDate: "2024-05-20",
      sellDate: "2024-06-10",
      amount: 100000,
      realizedProfit: 5000,
      unrealizedProfit: 67000,
      regretAmount: 62000,
      regretPercent: 1240,
      peakPrice: 0.70,
      txHash: "2pL8...6Tn4",
      explorerUrl: "https://solscan.io/tx/2pL8...6Tn4",
    },
    {
      id: `${address}-5`,
      tokenSymbol: "POPCAT",
      tokenName: "Popcat",
      buyPrice: 0.25,
      sellPrice: 0.55,
      buyDate: "2024-04-12",
      sellDate: "2024-05-18",
      amount: 25000,
      realizedProfit: 7500,
      unrealizedProfit: 56250,
      regretAmount: 48750,
      regretPercent: 650,
      peakPrice: 2.50,
      txHash: "4kB6...8Xm1",
      explorerUrl: "https://solscan.io/tx/4kB6...8Xm1",
    },
  ];

  return events;
};

export const generateTokenStats = (events: PaperhandsEvent[]): TokenStats[] => {
  const tokenMap = new Map<string, TokenStats>();

  events.forEach((event) => {
    if (!tokenMap.has(event.tokenSymbol)) {
      tokenMap.set(event.tokenSymbol, {
        symbol: event.tokenSymbol,
        buys: 0,
        sells: 0,
        avgEntry: 0,
        avgExit: 0,
        realized: 0,
        unrealized: 0,
        regret: 0,
      });
    }

    const stats = tokenMap.get(event.tokenSymbol)!;
    stats.buys += 1;
    stats.sells += 1;
    stats.avgEntry += event.buyPrice;
    stats.avgExit += event.sellPrice;
    stats.realized += event.realizedProfit;
    stats.unrealized += event.unrealizedProfit;
    stats.regret += event.regretAmount;
  });

  return Array.from(tokenMap.values()).map((stats) => ({
    ...stats,
    avgEntry: stats.avgEntry / stats.buys,
    avgExit: stats.avgExit / stats.sells,
  }));
};

export const generateMockWalletStats = (address: string): WalletStats => {
  const events = generateMockEvents(address);
  const totalRegret = events.reduce((sum, e) => sum + e.regretAmount, 0);
  const totalRealized = events.reduce((sum, e) => sum + e.realizedProfit, 0);

  return {
    address,
    ensName: address.startsWith("0x") ? `trader${address.slice(2, 6)}.eth` : undefined,
    handle: `@${address.slice(0, 8)}`,
    bio: "Degen trader | Exit liquidity provider | NGMI",
    tags: ["Swing", "Scalper", "Jeet"],
    socials: {
      twitter: `https://twitter.com/${address.slice(0, 8)}`,
    },
    paperhandsScore: Math.min(Math.round((totalRegret / totalRealized) * 10), 100),
    totalRegret,
    totalRegretPercent: Math.round((totalRegret / totalRealized) * 100),
    worstLoss: Math.max(...events.map((e) => e.regretAmount)),
    totalExitedEarly: events.length,
    totalEvents: events.length,
    avgHoldTime: 35,
    avgShouldaHoldTime: 120,
    winRate: 60,
    lossRate: 40,
    topRegrettedTokens: events
      .sort((a, b) => b.regretAmount - a.regretAmount)
      .slice(0, 3)
      .map((e) => ({
        symbol: e.tokenSymbol,
        regretAmount: e.regretAmount,
      })),
    events,
  };
};

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    address: "9xK2...7nL4",
    ensName: "cryptojeet.eth",
    totalRegret: 487650,
    regretPercent: 892,
    totalEvents: 12,
    paperhandsScore: 89,
    last24h: 12500,
    last7d: 87300,
  },
  {
    rank: 2,
    address: "4mP8...2vT9",
    ensName: "exitliq.sol",
    totalRegret: 423100,
    regretPercent: 756,
    totalEvents: 9,
    paperhandsScore: 76,
    last24h: 0,
    last7d: 45200,
  },
  {
    rank: 3,
    address: "7nR5...3wX1",
    totalRegret: 398200,
    regretPercent: 671,
    totalEvents: 11,
    paperhandsScore: 67,
    last24h: 8900,
    last7d: 92100,
  },
  {
    rank: 4,
    address: "2qL9...6pK8",
    ensName: "ngmi.eth",
    totalRegret: 356700,
    regretPercent: 598,
    totalEvents: 8,
    paperhandsScore: 60,
    last24h: 15600,
    last7d: 71200,
  },
  {
    rank: 5,
    address: "8tM3...5rN2",
    totalRegret: 312500,
    regretPercent: 523,
    totalEvents: 10,
    paperhandsScore: 52,
    last24h: 0,
    last7d: 38400,
  },
  {
    rank: 6,
    address: "1vB7...4sH9",
    ensName: "paperhands.sol",
    totalRegret: 289400,
    regretPercent: 487,
    totalEvents: 7,
    paperhandsScore: 49,
    last24h: 22100,
    last7d: 104300,
  },
  {
    rank: 7,
    address: "6wF4...8dC3",
    totalRegret: 267800,
    regretPercent: 445,
    totalEvents: 9,
    paperhandsScore: 45,
    last24h: 5700,
    last7d: 29800,
  },
  {
    rank: 8,
    address: "3xQ1...7mZ6",
    totalRegret: 245600,
    regretPercent: 412,
    totalEvents: 6,
    paperhandsScore: 41,
    last24h: 0,
    last7d: 18900,
  },
];
