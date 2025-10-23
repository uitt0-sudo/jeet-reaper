export interface Token {
  symbol: string;
  name: string;
  address: string;
  logoUrl?: string;
}

export interface PaperhandsEvent {
  id: string;
  tokenSymbol: string;
  tokenName: string;
  tokenMint?: string;
  buyPrice: number;
  sellPrice: number;
  buyDate: string;
  sellDate: string;
  peakDate?: string;
  amount: number;
  realizedProfit: number;
  unrealizedProfit: number;
  regretAmount: number;
  regretPercent: number;
  peakPrice: number;
  txHash: string;
  explorerUrl: string;
}

export interface WalletStats {
  address: string;
  ensName?: string;
  handle?: string;
  bio?: string;
  tags?: string[];
  socials?: {
    twitter?: string;
    discord?: string;
  };
  paperhandsScore: number;
  totalRegret: number;
  totalRegretPercent: number;
  worstLoss: number;
  totalExitedEarly: number;
  totalEvents: number;
  avgHoldTime: number;
  avgShouldaHoldTime: number;
  winRate: number;
  lossRate: number;
  topRegrettedTokens: Array<{
    symbol: string;
    regretAmount: number;
  }>;
  events: PaperhandsEvent[];
  analysisDateRange?: {
    startDate: string;
    endDate: string;
    daysBack: number;
  };
}

export interface LeaderboardEntry {
  rank: number;
  address: string;
  ensName?: string;
  totalRegret: number;
  regretPercent: number;
  totalEvents: number;
  paperhandsScore: number;
  last24h: number;
  last7d: number;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface TokenStats {
  symbol: string;
  buys: number;
  sells: number;
  avgEntry: number;
  avgExit: number;
  realized: number;
  unrealized: number;
  regret: number;
}
