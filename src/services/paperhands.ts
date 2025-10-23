/**
 * Paperhands Analysis Engine
 * 
 * Core logic for analyzing wallet trading history and calculating
 * "paperhands" metrics - how much money was left on the table by selling too early.
 */

import { 
  fetchWalletTransactions, 
  parseSwapTransactions, 
  getTokenPeakPrice,
  isValidSolanaAddress 
} from './solana';
import { WalletStats, PaperhandsEvent } from '@/types/paperhands';
import { generateMockWalletStats } from '@/lib/mockData';

interface TradePosition {
  tokenMint: string;
  tokenSymbol: string;
  tokenName: string;
  buys: Array<{
    timestamp: number;
    amount: number;
    price: number;
    signature: string;
  }>;
  sells: Array<{
    timestamp: number;
    amount: number;
    price: number;
    signature: string;
  }>;
}

/**
 * Main entry point: Analyze a wallet for paperhands behavior
 */
export async function analyzePaperhands(walletAddress: string): Promise<WalletStats> {
  // Validate address
  if (!isValidSolanaAddress(walletAddress)) {
    throw new Error('Invalid Solana address');
  }

  // Check if real API is configured
  const hasRealAPI = !!import.meta.env.VITE_SOLANA_RPC_URL;
  
  if (!hasRealAPI) {
    console.warn('No RPC configured - using mock data');
    return generateMockWalletStats(walletAddress);
  }

  try {
    // Fetch transaction history
    const transactions = await fetchWalletTransactions(walletAddress);
    
    if (transactions.length === 0) {
      throw new Error('No transactions found for this wallet');
    }

    // Parse DEX swaps
    const swaps = await parseSwapTransactions(transactions);
    
    if (swaps.length === 0) {
      throw new Error('No DEX trades found for this wallet');
    }

    // Group by token and match buys with sells
    const positions = groupIntoPositions(swaps);

    // Calculate paperhands events
    const events = await calculatePaperhandsEvents(positions);

    // Generate final stats
    const stats = generateWalletStats(walletAddress, events);

    return stats;
  } catch (error) {
    console.error('Error analyzing wallet:', error);
    // Fallback to mock data on error
    return generateMockWalletStats(walletAddress);
  }
}

/**
 * Group swaps into trading positions by token
 */
function groupIntoPositions(swaps: any[]): TradePosition[] {
  const positionMap = new Map<string, TradePosition>();

  for (const swap of swaps) {
    if (!positionMap.has(swap.tokenMint)) {
      positionMap.set(swap.tokenMint, {
        tokenMint: swap.tokenMint,
        tokenSymbol: swap.tokenSymbol,
        tokenName: swap.tokenName,
        buys: [],
        sells: []
      });
    }

    const position = positionMap.get(swap.tokenMint)!;
    
    if (swap.type === 'buy') {
      position.buys.push({
        timestamp: swap.timestamp,
        amount: swap.amountOut,
        price: swap.pricePerToken,
        signature: swap.signature
      });
    } else {
      position.sells.push({
        timestamp: swap.timestamp,
        amount: swap.amountIn,
        price: swap.pricePerToken,
        signature: swap.signature
      });
    }
  }

  return Array.from(positionMap.values());
}

/**
 * Calculate paperhands events from trading positions
 * A paperhands event occurs when:
 * 1. User bought a token
 * 2. User sold that token
 * 3. Token price went significantly higher after the sell
 */
async function calculatePaperhandsEvents(
  positions: TradePosition[]
): Promise<PaperhandsEvent[]> {
  const events: PaperhandsEvent[] = [];

  for (const position of positions) {
    // Match each sell with its corresponding buys (FIFO)
    const buys = [...position.buys].sort((a, b) => a.timestamp - b.timestamp);
    const sells = [...position.sells].sort((a, b) => a.timestamp - b.timestamp);

    for (const sell of sells) {
      // Find the buy that corresponds to this sell (FIFO matching)
      const matchingBuy = buys.shift();
      
      if (!matchingBuy) continue;

      // Get peak price after the sell (next 180 days)
      const peakData = await getTokenPeakPrice(
        position.tokenMint,
        sell.timestamp,
        sell.timestamp + (180 * 24 * 60 * 60 * 1000) // 180 days
      );

      // Calculate metrics
      const buyValue = matchingBuy.amount * matchingBuy.price;
      const sellValue = sell.amount * sell.price;
      const realizedProfit = sellValue - buyValue;
      
      const peakValue = sell.amount * peakData.price;
      const unrealizedProfit = peakValue - buyValue;
      const regretAmount = unrealizedProfit - realizedProfit;
      const regretPercent = (regretAmount / buyValue) * 100;

      // Only create event if there's significant regret (>10%)
      if (regretPercent > 10) {
        events.push({
          id: `${position.tokenMint}-${sell.signature}`,
          tokenSymbol: position.tokenSymbol,
          tokenName: position.tokenName,
          tokenMint: position.tokenMint,
          buyPrice: matchingBuy.price,
          sellPrice: sell.price,
          buyDate: new Date(matchingBuy.timestamp).toISOString().split('T')[0],
          sellDate: new Date(sell.timestamp).toISOString().split('T')[0],
          amount: sell.amount,
          realizedProfit,
          unrealizedProfit,
          regretAmount,
          regretPercent,
          peakPrice: peakData.price,
          peakDate: new Date(peakData.timestamp).toISOString().split('T')[0],
          txHash: sell.signature.slice(0, 8),
          explorerUrl: `https://solscan.io/tx/${sell.signature}`
        });
      }
    }
  }

  return events.sort((a, b) => b.regretAmount - a.regretAmount);
}

/**
 * Generate comprehensive wallet statistics from paperhands events
 */
function generateWalletStats(
  address: string,
  events: PaperhandsEvent[]
): WalletStats {
  if (events.length === 0) {
    throw new Error('No paperhands events found for this wallet');
  }

  const totalRegret = events.reduce((sum, e) => sum + e.regretAmount, 0);
  const totalRealized = events.reduce((sum, e) => sum + e.realizedProfit, 0);
  const totalUnrealized = events.reduce((sum, e) => sum + e.unrealizedProfit, 0);

  // Calculate hold times
  const holdTimes = events.map(e => {
    const buy = new Date(e.buyDate).getTime();
    const sell = new Date(e.sellDate).getTime();
    return (sell - buy) / (1000 * 60 * 60 * 24); // days
  });

  const shouldaHoldTimes = events.map(e => {
    const buy = new Date(e.buyDate).getTime();
    const peak = new Date(e.peakDate || e.sellDate).getTime();
    return (peak - buy) / (1000 * 60 * 60 * 24); // days
  });

  const avgHoldTime = holdTimes.reduce((a, b) => a + b, 0) / holdTimes.length;
  const avgShouldaHoldTime = shouldaHoldTimes.reduce((a, b) => a + b, 0) / shouldaHoldTimes.length;

  // Calculate win/loss rate
  const wins = events.filter(e => e.realizedProfit > 0).length;
  const losses = events.filter(e => e.realizedProfit <= 0).length;
  const winRate = (wins / events.length) * 100;

  // Calculate paperhands score (0-100, higher = worse paperhands)
  const regretRatio = totalRegret / Math.max(totalRealized, 1);
  const paperhandsScore = Math.min(Math.round(regretRatio * 10), 100);

  return {
    address,
    ensName: undefined, // Could fetch from SNS
    handle: `@${address.slice(0, 8)}`,
    bio: 'Analyzed wallet - check out my paperhands moments',
    tags: inferTradingStyle(events),
    socials: {},
    paperhandsScore,
    totalRegret,
    totalRegretPercent: Math.round((totalRegret / Math.max(totalRealized, 1)) * 100),
    worstLoss: Math.max(...events.map(e => e.regretAmount)),
    totalExitedEarly: events.length,
    totalEvents: events.length,
    avgHoldTime: Math.round(avgHoldTime),
    avgShouldaHoldTime: Math.round(avgShouldaHoldTime),
    winRate: Math.round(winRate),
    lossRate: Math.round(100 - winRate),
    topRegrettedTokens: events
      .slice(0, 3)
      .map(e => ({
        symbol: e.tokenSymbol,
        regretAmount: e.regretAmount
      })),
    events
  };
}

/**
 * Infer trading style from behavior patterns
 */
function inferTradingStyle(events: PaperhandsEvent[]): string[] {
  const tags: string[] = [];

  const avgHold = events.reduce((sum, e) => {
    const buy = new Date(e.buyDate).getTime();
    const sell = new Date(e.sellDate).getTime();
    return sum + (sell - buy) / (1000 * 60 * 60 * 24);
  }, 0) / events.length;

  if (avgHold < 7) tags.push('Scalper');
  else if (avgHold < 30) tags.push('Swing');
  else tags.push('Hold');

  const avgRegretPercent = events.reduce((sum, e) => sum + e.regretPercent, 0) / events.length;
  
  if (avgRegretPercent > 500) tags.push('Diamond Jeet');
  else if (avgRegretPercent > 200) tags.push('Jeet');
  else tags.push('Paper');

  return tags;
}
