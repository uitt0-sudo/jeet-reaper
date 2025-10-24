import { WalletStats, LeaderboardEntry, PaperhandsEvent, TokenStats } from "@/types/paperhands";

// Realistic low-cap memecoin names that people don't know
export const MOCK_TOKENS = [
  { symbol: "GUMMY", name: "Gummy", address: "GummyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxY" },
  { symbol: "SLERF", name: "Slerf", address: "SLERFxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxY" },
  { symbol: "SNAP", name: "Snapcat", address: "SNAPxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxY" },
  { symbol: "PONKE", name: "Ponke", address: "PONKExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxY" },
  { symbol: "WEN", name: "Wen", address: "WENxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxY" },
  { symbol: "TOOKER", name: "Tooker Kurlson", address: "TOOKERxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxY" },
  { symbol: "HARAMBE", name: "Harambe", address: "HARAMBExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxY" },
  { symbol: "TOSHI", name: "Toshi", address: "TOSHIxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxY" },
  { symbol: "FOMO", name: "Fomo", address: "FOMOxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxY" },
  { symbol: "SMOG", name: "Smog", address: "SMOGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxY" },
  { symbol: "BILLY", name: "Billy", address: "BILLYxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxY" },
  { symbol: "MYRO", name: "Myro", address: "MYROxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxY" },
  { symbol: "KITTY", name: "Kitty Coin", address: "KITTYxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxY" },
  { symbol: "GIGA", name: "Giga", address: "GIGAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxY" },
  { symbol: "HOBBES", name: "Hobbes", address: "HOBBESxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxY" },
];

export const generateMockEvents = (address: string): PaperhandsEvent[] => {
  const tokens = [...MOCK_TOKENS];
  const events: PaperhandsEvent[] = [];
  
  // Generate 8-12 random paperhands events with varied data
  const numEvents = Math.floor(Math.random() * 5) + 8;
  
  for (let i = 0; i < numEvents; i++) {
    const token = tokens[Math.floor(Math.random() * tokens.length)];
    const buyPrice = Math.random() * 0.5; // $0 - $0.50
    const sellMultiplier = 1.2 + Math.random() * 3; // 1.2x - 4.2x gain
    const sellPrice = buyPrice * sellMultiplier;
    const currentMultiplier = sellMultiplier + (0.5 + Math.random() * 3); // current price is higher than sell
    const currentPrice = buyPrice * currentMultiplier;
    const athMultiplier = currentMultiplier + (2 + Math.random() * 15); // ATH significantly higher
    const athPrice = buyPrice * athMultiplier;
    
    const amount = Math.floor(Math.random() * 5000000) + 100000; // 100k - 5M tokens
    const realizedProfit = amount * (sellPrice - buyPrice);
    const unrealizedProfit = amount * (currentPrice - buyPrice);
    const buyCost = amount * buyPrice;
    const sellValue = amount * sellPrice;
    const currentValue = amount * currentPrice;
    const athValue = amount * athPrice;
    const regretAmount = Math.max(0, currentValue - sellValue);
    const regretPercent = buyCost > 0 ? (regretAmount / buyCost) * 100 : 0;
    const athRegretAmount = Math.max(0, athValue - sellValue);
    const athRegretPercent = buyCost > 0 ? (athRegretAmount / buyCost) * 100 : 0;
    
    const buyDate = new Date(2024, Math.floor(Math.random() * 8), Math.floor(Math.random() * 28) + 1);
    const sellDate = new Date(buyDate.getTime() + (Math.random() * 60 + 7) * 24 * 60 * 60 * 1000); // 7-67 days later
    const athDate = new Date(sellDate.getTime() + (Math.random() * 90 + 15) * 24 * 60 * 60 * 1000);
    
    events.push({
      id: `${address}-${i}`,
      tokenSymbol: token.symbol,
      tokenName: token.name,
      tokenMint: token.address,
      buyPrice,
      sellPrice,
      buyDate: buyDate.toISOString().split('T')[0],
      sellDate: sellDate.toISOString().split('T')[0],
      amount,
      realizedProfit,
      unrealizedProfit,
      regretAmount,
      regretPercent,
      peakPrice: currentPrice,
      peakDate: new Date().toISOString().split('T')[0],
      athPrice,
      athDate: athDate.toISOString().split('T')[0],
      athRegretAmount,
      athRegretPercent,
      txHash: `${Math.random().toString(36).substring(2, 6)}...${Math.random().toString(36).substring(2, 6)}`,
      explorerUrl: `https://solscan.io/tx/${Math.random().toString(36).substring(2, 10)}`,
    });
  }
  
  return events.sort((a, b) => b.regretAmount - a.regretAmount);
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
  const totalRegretAtAth = events.reduce((sum, e) => sum + (e.athRegretAmount ?? 0), 0);

  return {
    address,
    ensName: address.startsWith("0x") ? `trader${address.slice(2, 6)}.eth` : undefined,
    handle: `@${address.slice(0, 8)}`,
    bio: "Degen trader | Exit liquidity provider | NGMI",
    tags: ["Swing", "Scalper", "Jeet"],
    socials: {
      twitter: `https://twitter.com/${address.slice(0, 8)}`,
    },
    paperhandsScore: Math.min(Math.round((totalRegret / Math.max(totalRealized, 1)) * 10), 100),
    totalRegret,
    totalRegretPercent: Math.round((totalRegret / Math.max(totalRealized, 1)) * 100),
    totalRegretAtAth,
    totalRegretAtAthPercent: Math.round((totalRegretAtAth / Math.max(totalRealized, 1)) * 100),
    worstLoss: Math.max(...events.map((e) => e.regretAmount)),
    worstLossAtAth: Math.max(...events.map((e) => e.athRegretAmount ?? 0)),
    totalExitedEarly: events.length,
    totalEvents: events.length,
    avgHoldTime: Math.floor(Math.random() * 30) + 15,
    avgShouldaHoldTime: Math.floor(Math.random() * 90) + 60,
    winRate: Math.floor(Math.random() * 30) + 50,
    lossRate: Math.floor(Math.random() * 30) + 20,
    topRegrettedTokens: events
      .sort((a, b) => b.regretAmount - a.regretAmount)
      .slice(0, 10)
      .map((e) => ({
        symbol: e.tokenSymbol,
        tokenMint: e.tokenMint || '',
        regretAmount: e.regretAmount,
        athRegretAmount: e.athRegretAmount ?? 0,
      })),
    events,
  };
};

// Generate realistic leaderboard with random wallets and varied stats
export const MOCK_LEADERBOARD: LeaderboardEntry[] = Array.from({ length: 50 }, (_, i) => {
  const randomAddress = Math.random().toString(36).substring(2, 6) + '...' + Math.random().toString(36).substring(2, 6);
  const hasEns = Math.random() > 0.6;
  const ensNames = ['paperjeet.sol', 'exitliq.eth', 'ngmi.sol', 'diamond.hands', 'ser.sol', 'wen.lambo', 'rekt.eth', 'cope.sol', 'degen.eth', 'rugged.sol'];
  
  const totalRegret = Math.floor(Math.random() * 500000) + 50000;
  const regretPercent = Math.floor(Math.random() * 1200) + 200;
  const totalEvents = Math.floor(Math.random() * 25) + 3;
  const paperhandsScore = Math.min(Math.round((regretPercent / 15)), 100);
  
  return {
    rank: i + 1,
    address: randomAddress,
    ensName: hasEns ? ensNames[Math.floor(Math.random() * ensNames.length)] : undefined,
    totalRegret,
    regretPercent,
    totalEvents,
    paperhandsScore,
    last24h: Math.random() > 0.4 ? Math.floor(Math.random() * 30000) : 0,
    last7d: Math.floor(Math.random() * 150000),
  };
}).sort((a, b) => b.totalRegret - a.totalRegret).map((entry, i) => ({ ...entry, rank: i + 1 }));
