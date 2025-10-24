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
  fetchTokenAllTimeHigh,
  isValidSolanaAddress,
  ProgressCallback
} from './solana';
import { WalletStats, PaperhandsEvent } from '@/types/paperhands';
import { generateMockWalletStats } from '@/lib/mockData';

interface TradePosition {
  tokenMint: string;
  tokenSymbol: string;
  tokenName: string;
  tokenLogo?: string;
  tokenLogos?: string[];
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
      console.info(`No coin buys or sells found${timeRangeText}. Proceeding with empty results.`);
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
      console.info(`No paperhands events over $100 detected${timeRangeText}.`);
    }

    console.log(`Found ${events.length} paperhands events`);

    // Generate final stats
    onProgress?.(`Calculating regret metrics${timeRangeText}...`, 90);
    onProgress?.(`Generating final report${timeRangeText}...`, 95);
    const stats = generateWalletStats(walletAddress, events, daysBack, startDate, endDate, positions.length);

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
      const fallbackSymbol = swap.tokenSymbol || (swap.tokenMint ? `${swap.tokenMint.slice(0, 4)}...${swap.tokenMint.slice(-4)}` : 'Unknown');
      const fallbackName = swap.tokenName || fallbackSymbol || 'Unknown Token';
      positionMap.set(swap.tokenMint, {
        tokenMint: swap.tokenMint,
        tokenSymbol: fallbackSymbol,
        tokenName: fallbackName,
        tokenLogo: swap.tokenLogo,
        tokenLogos: swap.tokenLogos,
        buys: [],
        sells: []
      });
    }

    const position = positionMap.get(swap.tokenMint)!;
    if (!position.tokenSymbol && swap.tokenSymbol) {
      position.tokenSymbol = swap.tokenSymbol;
    }
    if (!position.tokenName && swap.tokenName) {
      position.tokenName = swap.tokenName;
    }
    if (!position.tokenLogo && swap.tokenLogo) {
      position.tokenLogo = swap.tokenLogo;
    }
    if (swap.tokenLogos && swap.tokenLogos.length > 0) {
      const existing = new Set(position.tokenLogos ?? []);
      for (const logo of swap.tokenLogos) {
        if (logo) existing.add(logo);
      }
      position.tokenLogos = Array.from(existing);
    }
    
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
    const buys = [...position.buys]
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(buy => {
        const amount = buy.amount ?? 0;
        const totalCost = buy.totalCost || (amount * buy.price);
        const unitCost = amount > 0 ? totalCost / amount : 0;
        return {
          ...buy,
          remainingAmount: amount,
          unitCost,
        };
      });
    const sells = [...position.sells].sort((a, b) => a.timestamp - b.timestamp);

    // Get current price once per token (may fail for dead/unlisted tokens)
    let currentPrice = 0;
    let marketCap = 0;
    let athPrice = 0;
    let athTimestamp: number | undefined;
    try {
      const [priceResult, marketCapResult, athResult] = await Promise.all([
        getCurrentPriceOnly(position.tokenMint),
        fetchTokenMarketCap(position.tokenMint),
        fetchTokenAllTimeHigh(position.tokenMint),
      ]);
      currentPrice = priceResult;
      marketCap = marketCapResult;
      console.log("athResult: ", athResult);
      athPrice = athResult?.price ?? 0;
      athTimestamp = athResult?.timestamp;
    } catch (error) {
      console.warn(`Could not fetch data for ${position.tokenSymbol}`);
    }

    for (const sell of sells) {
      const sellAmount = sell.amount ?? 0;
      if (sellAmount <= 0) continue;

      let remainingToMatch = sellAmount;
      const matchedLots: Array<{ amount: number; cost: number; timestamp: number }> = [];
      const EPSILON = 1e-9;

      while (remainingToMatch > EPSILON && buys.length > 0) {
        const lot = buys[0];
        const amountFromLot = Math.min(lot.remainingAmount, remainingToMatch);
        if (amountFromLot <= 0) {
          buys.shift();
          continue;
        }

        const cost = lot.unitCost * amountFromLot;
        matchedLots.push({
          amount: amountFromLot,
          cost,
          timestamp: lot.timestamp,
        });

        lot.remainingAmount -= amountFromLot;
        remainingToMatch -= amountFromLot;

        if (lot.remainingAmount <= EPSILON) {
          buys.shift();
        }
      }

      const matchedAmount = matchedLots.reduce((sum, lot) => sum + lot.amount, 0);
      if (matchedAmount <= EPSILON) {
        console.debug(`No matching buys found for sell ${sell.signature} of ${position.tokenSymbol}`);
        continue;
      }

      const proportionMatched = sellAmount > 0 ? Math.min(1, matchedAmount / sellAmount) : 1;
      const grossSellValue = sell.totalValue || (sellAmount * sell.price);
      const sellValue = grossSellValue * proportionMatched;
      const buyValue = matchedLots.reduce((sum, lot) => sum + lot.cost, 0);
      const realizedProfit = sellValue - buyValue;
      
      // Current value if still holding (use current price if available, else sell price)
      const inferredSellPrice = (matchedAmount > 0 && sellValue > 0)
        ? sellValue / matchedAmount
        : sell.price;
      const effectiveCurrentPrice = currentPrice > 0
        ? currentPrice
        : (inferredSellPrice > 0 ? inferredSellPrice : (buyValue > 0 && matchedAmount > 0 ? buyValue / matchedAmount : 0));
      const currentValue = matchedAmount * effectiveCurrentPrice;
      const missedSinceSell = Math.max(0, currentValue - sellValue);
      const regretPercent = buyValue > 0 ? (missedSinceSell / buyValue) * 100 : 0;

      const athValue = matchedAmount * athPrice;
      const missedAtAth = Math.max(0, athValue - sellValue);
      const regretPercentAth = buyValue > 0 ? (missedAtAth / buyValue) * 100 : 0;

      const averageBuyPrice = matchedAmount > 0 ? buyValue / matchedAmount : 0;
      const sellPrice = matchedAmount > 0 ? sellValue / matchedAmount : sell.price;
      const earliestBuyTimestamp = matchedLots.reduce(
        (earliest, lot) => Math.min(earliest, lot.timestamp),
        matchedLots[0]?.timestamp ?? sell.timestamp
      );

      // Create event if there's any loss OR significant missed opportunity above $100
      const hasSignificantRegret = (missedSinceSell >= 100);
      const hadSignificantLoss = (realizedProfit < 0 && Math.abs(realizedProfit) >= 100);
      const hasAthRegret = (missedAtAth >= 100);
      
      if (hasSignificantRegret || hadSignificantLoss || hasAthRegret) {
        events.push({
          id: `${position.tokenMint}-${sell.signature}`,
          tokenSymbol: position.tokenSymbol,
          tokenName: position.tokenName,
          tokenMint: position.tokenMint,
          tokenLogo: position.tokenLogo,
          tokenLogos: position.tokenLogos,
          buyPrice: averageBuyPrice,
          sellPrice,
          buyDate: new Date(earliestBuyTimestamp).toISOString().split('T')[0],
          sellDate: new Date(sell.timestamp).toISOString().split('T')[0],
          amount: matchedAmount,
          realizedProfit,
          unrealizedProfit: currentValue - buyValue,
          regretAmount: missedSinceSell,
          regretPercent,
          peakPrice: effectiveCurrentPrice,
          athPrice,
          athDate: athTimestamp ? new Date(athTimestamp).toISOString().split('T')[0] : undefined,
          athRegretAmount: missedAtAth,
          athRegretPercent: regretPercentAth,
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
  endDate?: Date,
  coinsTradedCount?: number
): WalletStats {
  const totalRegret = events.reduce((sum, e) => sum + e.regretAmount, 0);
  const totalRealized = events.reduce((sum, e) => sum + e.realizedProfit, 0);
  const totalRegretAtAth = events.reduce((sum, e) => sum + (e.athRegretAmount ?? 0), 0);

  // Calculate hold times
  const holdTimes = events.map(e => {
    const buy = new Date(e.buyDate).getTime();
    const sell = new Date(e.sellDate).getTime();
    return (sell - buy) / (1000 * 60 * 60 * 24); // days
  });

  const avgHoldTime = holdTimes.length > 0 ? holdTimes.reduce((a, b) => a + b, 0) / holdTimes.length : 0;

  // Calculate win/loss rate
  const wins = events.filter(e => e.realizedProfit > 0).length;
  const losses = events.filter(e => e.realizedProfit <= 0).length;
  const winRate = events.length > 0 ? (wins / events.length) * 100 : 0;

  // Calculate paperhands score (0-100, higher = worse paperhands)
  const regretRatio = totalRealized !== 0 ? totalRegret / Math.abs(totalRealized) : 0;
  const paperhandsScore = Math.min(Math.round(regretRatio * 10), 100);
  const totalRegretPercent = totalRealized !== 0 ? Math.round((totalRegret / Math.abs(totalRealized)) * 100) : 0;
  const totalRegretAtAthPercent = totalRealized !== 0 ? Math.round((totalRegretAtAth / Math.abs(totalRealized)) * 100) : 0;
  const worstLoss = events.length > 0 ? Math.max(...events.map(e => e.regretAmount)) : 0;
  const worstLossAtAth = events.length > 0 ? Math.max(...events.map(e => e.athRegretAmount ?? 0)) : 0;

  return {
    address,
    ensName: undefined, // Could fetch from SNS
    handle: `@${address.slice(0, 8)}`,
    bio: 'Analyzed wallet - check out my paperhands moments',
    tags: inferTradingStyle(events),
    socials: {},
    paperhandsScore,
    totalRegret,
    totalRegretPercent,
    totalRegretAtAth,
    totalRegretAtAthPercent,
    worstLoss,
    worstLossAtAth,
    totalExitedEarly: events.length,
    totalEvents: events.length,
    avgHoldTime: Math.round(avgHoldTime),
    avgShouldaHoldTime: 0, // Removed fake "shoulda held" metric
    winRate: Math.round(winRate),
    lossRate: Math.round(100 - Math.min(Math.round(winRate), 100)),
    topRegrettedTokens: (() => {
      // Aggregate regret by tokenMint (fallback to symbol)
      const byMint = new Map<string, { regret: number; athRegret: number; symbol: string; tokenLogo?: string; tokenLogos?: string[] }>();
      for (const e of events) {
        const key = e.tokenMint || e.tokenSymbol;
        const entry = byMint.get(key) || { regret: 0, athRegret: 0, symbol: e.tokenSymbol, tokenLogo: e.tokenLogo, tokenLogos: e.tokenLogos };
        entry.regret += e.regretAmount;
        entry.athRegret += e.athRegretAmount ?? 0;
        entry.symbol = e.tokenSymbol || entry.symbol;
        if (!entry.tokenLogo && e.tokenLogo) {
          entry.tokenLogo = e.tokenLogo;
        }
        if (e.tokenLogos && e.tokenLogos.length > 0) {
          const existing = new Set(entry.tokenLogos ?? []);
          for (const logo of e.tokenLogos) {
            if (logo) existing.add(logo);
          }
          entry.tokenLogos = Array.from(existing);
        }
        byMint.set(key, entry);
      }
      return Array.from(byMint.entries())
        .sort((a, b) => b[1].regret - a[1].regret)
        .slice(0, 10)
        .map(([mint, v]) => ({
          symbol: v.symbol,
          tokenMint: mint,
          regretAmount: v.regret,
          athRegretAmount: v.athRegret,
          tokenLogo: v.tokenLogo,
          tokenLogos: v.tokenLogos,
        }));
    })(),
    events,
    analysisDateRange: daysBack && startDate && endDate ? {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      daysBack
    } : undefined,
    coinsTraded: coinsTradedCount,
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
