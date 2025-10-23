/**
 * Paperhands Analysis Engine
 * 
 * Core logic for analyzing wallet trading history and calculating
 * "paperhands" metrics - how much money was left on the table by selling too early.
 */

import { 
  parseSwapsWithEnhancedAPI,
  getCurrentPriceOnly,
  fetchTokenMarketCap,
  isValidSolanaAddress,
  ProgressCallback
} from './solana';
import { WalletStats, PaperhandsEvent } from '@/types/paperhands';
import { generateMockWalletStats } from '@/lib/mockData';

interface TradePosition {
  tokenMint: string;
  tokenSymbol: string;
  tokenName: string;
  buys: Array<{
    signature: string;
    timestamp: number;
    amount: number;
    price: number;
    totalCost: number;
  }>;
  sells: Array<{
    signature: string;
    timestamp: number;
    amount: number;
    price: number;
    totalValue: number;
  }>;
}

/**
 * Main entry point: Analyze a wallet for paperhands behavior
 */
export async function analyzePaperhands(
  walletAddress: string,
  daysBack?: number,
  onProgress?: ProgressCallback
): Promise<WalletStats> {
  // Validate address
  if (!isValidSolanaAddress(walletAddress)) {
    throw new Error('Invalid Solana wallet address');
  }

  try {
    const timeRangeText = daysBack ? ` (last ${daysBack} days)` : '';
    console.log(`Starting analysis${timeRangeText} for wallet:`, walletAddress);
    onProgress?.(`Starting wallet analysis${timeRangeText}...`, 0);
    
    // Calculate date range
    const endDate = new Date();
    const startDate = daysBack 
      ? new Date(endDate.getTime() - daysBack * 24 * 60 * 60 * 1000)
      : new Date(0);
    
    // Parse trades using Enhanced API (accurate, fast)
    onProgress?.(`Fetching and parsing trades${timeRangeText}...`, 5);
    const swaps = await parseSwapsWithEnhancedAPI(walletAddress, daysBack, onProgress);
    
    console.log(`Found ${swaps.length} signatures from Enhanced API${timeRangeText}`);
    
    if (swaps.length === 0) {
      throw new Error(`No coin buys or sells found${timeRangeText}. Only SOL/USDC trades are analyzed.`);
    }

    console.log(`Parsed ${swaps.length} coin trades${timeRangeText}`);

    // Group by token and match buys with sells
    onProgress?.(`Grouping trades by token${timeRangeText}...`, 80);
    const positions = groupIntoPositions(swaps);

    console.log(`Grouped into ${positions.length} trading positions`);

    // Calculate paperhands events
    onProgress?.(`Calculating regret metrics${timeRangeText}...`, 85);
    const events = await calculatePaperhandsEvents(positions, onProgress);

    if (events.length === 0) {
      throw new Error(`No paperhands events detected${timeRangeText}. This wallet may have held their positions well!`);
    }

    console.log(`Found ${events.length} paperhands events`);

    // Generate final stats
    onProgress?.(`Calculating regret metrics${timeRangeText}...`, 90);
    onProgress?.(`Generating final report${timeRangeText}...`, 95);
    const stats = generateWalletStats(walletAddress, events, daysBack, startDate, endDate);

    onProgress?.('Analysis complete!', 100);
    return stats;
  } catch (error) {
    console.error('Error analyzing wallet:', error);
    throw error;
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
        signature: swap.signature,
        timestamp: swap.timestamp,
        amount: swap.amountOut,
        price: swap.pricePerToken,
        totalCost: swap.amountIn
      });
    } else {
      position.sells.push({
        signature: swap.signature,
        timestamp: swap.timestamp,
        amount: swap.amountIn,
        price: swap.pricePerToken,
        totalValue: swap.amountOut
      });
    }
  }

  return Array.from(positionMap.values());
}

/**
 * Calculate paperhands events using CURRENT PRICE ONLY (no fake estimates)
 * "Regret" = what you missed since sell, based on current price
 */
async function calculatePaperhandsEvents(
  positions: TradePosition[],
  onProgress?: ProgressCallback
): Promise<PaperhandsEvent[]> {
  const events: PaperhandsEvent[] = [];
  const totalPositions = positions.length;

  for (let idx = 0; idx < positions.length; idx++) {
    const position = positions[idx];
    const progressPercent = 85 + (idx / totalPositions) * 10; // 85% to 95%
    onProgress?.(`Analyzing ${position.tokenSymbol}...`, progressPercent);
    
    // Match each sell with its corresponding buys (FIFO)
    const buys = [...position.buys].sort((a, b) => a.timestamp - b.timestamp);
    const sells = [...position.sells].sort((a, b) => a.timestamp - b.timestamp);

    // Get current price once per token (may fail for dead/unlisted tokens)
    let currentPrice = 0;
    let marketCap = 0;
    try {
      currentPrice = await getCurrentPriceOnly(position.tokenMint);
      marketCap = await fetchTokenMarketCap(position.tokenMint);
    } catch (error) {
      console.warn(`Could not fetch data for ${position.tokenSymbol}`);
    }

    for (const sell of sells) {
      // Find the buy that corresponds to this sell (FIFO matching)
      const matchingBuy = buys.shift();
      
      if (!matchingBuy) continue;

      // Calculate metrics
      const buyValue = matchingBuy.totalCost || (matchingBuy.amount * matchingBuy.price);
      const sellValue = sell.totalValue || (sell.amount * sell.price);
      const realizedProfit = sellValue - buyValue;
      
      // Current value if still holding (use current price if available, else sell price)
      const effectiveCurrentPrice = currentPrice > 0 ? currentPrice : sell.price;
      const currentValue = sell.amount * effectiveCurrentPrice;
      const missedSinceSell = Math.max(0, currentValue - sellValue);
      const regretPercent = buyValue > 0 ? (missedSinceSell / buyValue) * 100 : 0;

      // Create event if there's any loss OR significant missed opportunity
      // Lower threshold to 5% to catch more paperhands
      const hasSignificantRegret = (regretPercent > 5 && missedSinceSell > 0.01);
      const hadLoss = realizedProfit < 0;
      
      if (hasSignificantRegret || hadLoss) {
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
          unrealizedProfit: currentValue - buyValue,
          regretAmount: missedSinceSell,
          regretPercent,
          peakPrice: effectiveCurrentPrice,
          peakDate: new Date().toISOString().split('T')[0],
          marketCap,
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
  events: PaperhandsEvent[],
  daysBack?: number,
  startDate?: Date,
  endDate?: Date
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

  const avgHoldTime = holdTimes.reduce((a, b) => a + b, 0) / holdTimes.length;

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
    avgShouldaHoldTime: 0, // Removed fake "shoulda held" metric
    winRate: Math.round(winRate),
    lossRate: Math.round(100 - winRate),
    topRegrettedTokens: (() => {
      // Aggregate regret by tokenMint (fallback to symbol)
      const byMint = new Map<string, { regret: number; symbol: string }>();
      for (const e of events) {
        const key = e.tokenMint || e.tokenSymbol;
        const entry = byMint.get(key) || { regret: 0, symbol: e.tokenSymbol };
        entry.regret += e.regretAmount;
        entry.symbol = e.tokenSymbol || entry.symbol;
        byMint.set(key, entry);
      }
      return Array.from(byMint.entries())
        .sort((a, b) => b[1].regret - a[1].regret)
        .slice(0, 3)
        .map(([mint, v]) => ({ symbol: v.symbol, tokenMint: mint, regretAmount: v.regret }));
    })(),
    events,
    analysisDateRange: daysBack && startDate && endDate ? {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      daysBack
    } : undefined
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
