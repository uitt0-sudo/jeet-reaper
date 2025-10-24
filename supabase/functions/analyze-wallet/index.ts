import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TokenMetadata {
  mint: string;
  symbol: string;
  name: string;
  logo?: string;
}

interface TokenPrice {
  mint: string;
  price: number;
  marketCap?: number;
  athPrice?: number;
}

interface Swap {
  timestamp: number;
  tokenMint: string;
  tokenSymbol: string;
  type: 'buy' | 'sell';
  solAmount: number;
  tokenAmount: number;
  price: number;
  signature: string;
}

interface TradePosition {
  tokenMint: string;
  tokenSymbol: string;
  buys: Array<{ price: number; amount: number; timestamp: number; signature: string }>;
  sells: Array<{ price: number; amount: number; timestamp: number; signature: string }>;
}

interface PaperhandsEvent {
  id: string;
  tokenSymbol: string;
  tokenName: string;
  tokenMint: string;
  buyPrice: number;
  sellPrice: number;
  buyDate: string;
  sellDate: string;
  amount: number;
  realizedProfit: number;
  unrealizedProfit: number;
  regretAmount: number;
  regretPercent: number;
  peakPrice: number;
  marketCap?: number;
  txHash: string;
  explorerUrl: string;
}

const HELIUS_API_KEY = Deno.env.get('HELIUS_API_KEY');
if (!HELIUS_API_KEY) {
  console.error('[analyze-wallet] HELIUS_API_KEY not set');
  throw new Error('HELIUS_API_KEY environment variable is not set');
}
const HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { walletAddress, daysBack = 30 } = await req.json();

    console.log(`[analyze-wallet] Starting analysis for ${walletAddress}, ${daysBack} days back`);

    // 1. Check cache first (1-hour TTL)
    const cached = await getCachedAnalysis(supabase, walletAddress, daysBack);
    if (cached) {
      console.log(`[analyze-wallet] Cache hit for ${walletAddress}`);
      return new Response(
        JSON.stringify({ ...cached, fromCache: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[analyze-wallet] Cache miss, performing full analysis`);

    // 2. Fetch swap data
    const swaps = await parseSwapsWithEnhancedAPI(walletAddress, daysBack);
    console.log(`[analyze-wallet] Found ${swaps.length} swaps`);

    if (swaps.length === 0) {
      // Return a friendly empty analysis instead of 404
      const stats = generateWalletStats(walletAddress, [], daysBack);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await supabase.from('wallet_analyses').insert({
        wallet_address: walletAddress,
        total_regret: stats.totalRegret,
        total_events: stats.totalEvents,
        coins_traded: stats.coinsTraded,
        win_rate: stats.winRate,
        avg_hold_time: stats.avgHoldTime,
        top_regretted_tokens: stats.topRegrettedTokens,
        analysis_date_range: stats.analysisDateRange,
        expires_at: expiresAt.toISOString(),
      });

      return new Response(
        JSON.stringify({ ...stats, fromCache: false, message: 'No swap transactions found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Extract unique token mints
    const uniqueMints = [...new Set(swaps.map(s => s.tokenMint))];
    console.log(`[analyze-wallet] Analyzing ${uniqueMints.length} unique tokens`);

    // 4. Batch fetch metadata and prices (with caching)
    const metadata = await getTokenMetadataBatch(supabase, uniqueMints);
    const prices = await getTokenPricesBatch(supabase, uniqueMints);

    // 5. Group swaps into positions
    const positions = groupIntoPositions(swaps);

    // 6. Calculate paperhands events
    const events = await calculatePaperhandsEvents(positions, prices, metadata);
    console.log(`[analyze-wallet] Calculated ${events.length} paperhands events`);

    // 7. Generate wallet stats
    const stats = generateWalletStats(walletAddress, events, daysBack);

    // 8. Save to database with expiration
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await supabase.from('wallet_analyses').insert({
      wallet_address: walletAddress,
      total_regret: stats.totalRegret,
      total_events: stats.totalEvents,
      coins_traded: stats.coinsTraded,
      win_rate: stats.winRate,
      avg_hold_time: stats.avgHoldTime,
      top_regretted_tokens: stats.topRegrettedTokens,
      analysis_date_range: stats.analysisDateRange,
      expires_at: expiresAt.toISOString(),
    });

    console.log(`[analyze-wallet] Analysis complete for ${walletAddress}`);

    return new Response(
      JSON.stringify({ ...stats, fromCache: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[analyze-wallet] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function getCachedAnalysis(supabase: any, walletAddress: string, daysBack: number) {
  const { data } = await supabase
    .from('wallet_analyses')
    .select('*')
    .eq('wallet_address', walletAddress)
    .gt('expires_at', new Date().toISOString())
    .order('analyzed_at', { ascending: false })
    .limit(1)
    .single();

  if (data) {
    return {
      address: data.wallet_address,
      totalRegret: parseFloat(data.total_regret),
      totalEvents: data.total_events,
      coinsTraded: data.coins_traded,
      winRate: parseFloat(data.win_rate),
      avgHoldTime: parseFloat(data.avg_hold_time),
      topRegrettedTokens: data.top_regretted_tokens,
      analysisDateRange: data.analysis_date_range,
      analyzed_at: data.analyzed_at,
      events: [],
    };
  }

  return null;
}

async function getTokenMetadataBatch(supabase: any, mints: string[]): Promise<Map<string, TokenMetadata>> {
  // Check cache first
  const { data: cached } = await supabase
    .from('token_metadata')
    .select('*')
    .in('mint', mints);

  const cachedMap = new Map<string, TokenMetadata>(
    (cached || []).map((t: any) => [t.mint, {
      mint: t.mint,
      symbol: t.symbol,
      name: t.name,
      logo: t.logo,
    }])
  );

  const missingMints = mints.filter(m => !cachedMap.has(m));

  if (missingMints.length > 0) {
    console.log(`[metadata] Fetching ${missingMints.length} missing tokens from DexScreener`);
    const newMetadata = await fetchMetadataFromDexScreener(missingMints);
    
    if (newMetadata.length > 0) {
      await supabase.from('token_metadata').upsert(
        newMetadata.map(m => ({
          mint: m.mint,
          symbol: m.symbol,
          name: m.name,
          logo: m.logo,
          updated_at: new Date().toISOString(),
        }))
      );

      newMetadata.forEach(m => cachedMap.set(m.mint, m));
    }
  }

  return cachedMap;
}

async function getTokenPricesBatch(supabase: any, mints: string[]): Promise<Map<string, TokenPrice>> {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  // Get fresh prices from cache
  const { data: cached } = await supabase
    .from('token_prices')
    .select('*')
    .in('mint', mints)
    .gt('updated_at', fiveMinutesAgo.toISOString());

  const cachedMap = new Map<string, TokenPrice>(
    (cached || []).map((t: any) => [t.mint, {
      mint: t.mint,
      price: parseFloat(t.price),
      marketCap: t.market_cap ? parseFloat(t.market_cap) : undefined,
      athPrice: t.ath_price ? parseFloat(t.ath_price) : undefined,
    }])
  );

  const staleMints = mints.filter(m => !cachedMap.has(m));

  if (staleMints.length > 0) {
    console.log(`[prices] Fetching ${staleMints.length} stale prices from DexScreener`);
    const newPrices = await fetchPricesFromDexScreener(staleMints);
    
    if (newPrices.length > 0) {
      await supabase.from('token_prices').upsert(
        newPrices.map(p => ({
          mint: p.mint,
          price: p.price,
          market_cap: p.marketCap,
          ath_price: p.athPrice,
          updated_at: new Date().toISOString(),
        }))
      );

      newPrices.forEach(p => cachedMap.set(p.mint, p));
    }
  }

  return cachedMap;
}

async function fetchMetadataFromDexScreener(mints: string[]): Promise<TokenMetadata[]> {
  const results: TokenMetadata[] = [];
  
  // Batch fetch in groups of 30
  for (let i = 0; i < mints.length; i += 30) {
    const batch = mints.slice(i, i + 30);
    const mintParams = batch.join(',');
    
    try {
      const response = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${mintParams}`
      );
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.pairs && Array.isArray(data.pairs)) {
          const seenMints = new Set<string>();
          
          for (const pair of data.pairs) {
            if (pair.baseToken && !seenMints.has(pair.baseToken.address)) {
              results.push({
                mint: pair.baseToken.address,
                symbol: pair.baseToken.symbol || 'UNKNOWN',
                name: pair.baseToken.name || 'Unknown Token',
                logo: pair.info?.imageUrl,
              });
              seenMints.add(pair.baseToken.address);
            }
          }
        }
      }
      
      // Rate limit: wait 300ms between batches
      if (i + 30 < mints.length) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } catch (error) {
      console.error(`[metadata] Error fetching batch:`, error);
    }
  }

  return results;
}

async function fetchPricesFromDexScreener(mints: string[]): Promise<TokenPrice[]> {
  const results: TokenPrice[] = [];
  
  // Batch fetch in groups of 30
  for (let i = 0; i < mints.length; i += 30) {
    const batch = mints.slice(i, i + 30);
    const mintParams = batch.join(',');
    
    try {
      const response = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${mintParams}`
      );
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.pairs && Array.isArray(data.pairs)) {
          const priceMap = new Map<string, TokenPrice>();
          
          for (const pair of data.pairs) {
            if (pair.baseToken && pair.priceUsd) {
              const mint = pair.baseToken.address;
              const currentPrice = parseFloat(pair.priceUsd);
              
              if (!priceMap.has(mint) || currentPrice > (priceMap.get(mint)?.price || 0)) {
                priceMap.set(mint, {
                  mint,
                  price: currentPrice,
                  marketCap: pair.marketCap ? parseFloat(pair.marketCap) : undefined,
                  athPrice: pair.priceUsd ? parseFloat(pair.priceUsd) : undefined,
                });
              }
            }
          }
          
          results.push(...priceMap.values());
        }
      }
      
      // Rate limit: wait 300ms between batches
      if (i + 30 < mints.length) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } catch (error) {
      console.error(`[prices] Error fetching batch:`, error);
    }
  }

  return results;
}

async function parseSwapsWithEnhancedAPI(walletAddress: string, daysBack: number): Promise<Swap[]> {
  const now = Math.floor(Date.now() / 1000);
  const startTime = now - (daysBack * 24 * 60 * 60);

  try {
    const response = await fetch(HELIUS_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'paperhands-analysis',
        method: 'getSignaturesForAddress',
        params: [
          walletAddress,
          {
            limit: 1000,
            before: null,
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[parseSwaps] Helius RPC error: ${response.status} - ${errorText}`);
      throw new Error(`Failed to fetch transactions: ${response.status} ${errorText}`);
    }

    const { result } = await response.json();
    
    if (!result || result.length === 0) {
      return [];
    }

    // Filter by time
    const recentSigs = result
      .filter((tx: any) => tx.blockTime && tx.blockTime >= startTime)
      .slice(0, 500);

    // Fetch transaction details in batches
    const swaps: Swap[] = [];
    const batchSize = 100;

    for (let i = 0; i < recentSigs.length; i += batchSize) {
      const batch = recentSigs.slice(i, i + batchSize);
      const signatures = batch.map((sig: any) => sig.signature);

      const txResponse = await fetch(HELIUS_RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'get-transactions',
          method: 'getTransactions',
          params: [signatures]
        })
      });

      if (txResponse.ok) {
        const { result: transactions } = await txResponse.json();
        
        for (const tx of transactions) {
          if (!tx) continue;

          const parsedSwaps = parseSwapTransaction(tx, walletAddress);
          swaps.push(...parsedSwaps);
        }
      }

      // Rate limit
      if (i + batchSize < recentSigs.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    return swaps;

  } catch (error) {
    console.error('[parseSwaps] Error:', error);
    throw error;
  }
}

function parseSwapTransaction(tx: any, walletAddress: string): Swap[] {
  const swaps: Swap[] = [];
  
  if (!tx.meta || !tx.blockTime) return swaps;

  const preBalances = tx.meta.preTokenBalances || [];
  const postBalances = tx.meta.postTokenBalances || [];
  const solPreBalance = tx.meta.preBalances?.[0] || 0;
  const solPostBalance = tx.meta.postBalances?.[0] || 0;

  // Filter pump.fun tokens
  const isPumpFun = tx.transaction?.message?.accountKeys?.some((key: any) =>
    key.toString() === '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P'
  );

  if (isPumpFun) return swaps;

  // Group balances by mint
  const balanceChanges = new Map<string, { pre: number; post: number; decimals: number }>();

  for (const preBalance of preBalances) {
    if (preBalance.owner === walletAddress) {
      balanceChanges.set(preBalance.mint, {
        pre: preBalance.uiTokenAmount.uiAmount || 0,
        post: 0,
        decimals: preBalance.uiTokenAmount.decimals,
      });
    }
  }

  for (const postBalance of postBalances) {
    if (postBalance.owner === walletAddress) {
      const existing = balanceChanges.get(postBalance.mint);
      if (existing) {
        existing.post = postBalance.uiTokenAmount.uiAmount || 0;
      } else {
        balanceChanges.set(postBalance.mint, {
          pre: 0,
          post: postBalance.uiTokenAmount.uiAmount || 0,
          decimals: postBalance.uiTokenAmount.decimals,
        });
      }
    }
  }

  const solChange = (solPostBalance - solPreBalance) / 1e9;

  // Parse swaps
  for (const [mint, balance] of balanceChanges) {
    const tokenChange = balance.post - balance.pre;
    
    if (Math.abs(tokenChange) < 0.0001) continue;

    const isBuy = tokenChange > 0;
    const tokenAmount = Math.abs(tokenChange);
    const solAmount = Math.abs(solChange);
    
    if (solAmount < 0.001) continue;

    swaps.push({
      timestamp: tx.blockTime * 1000,
      tokenMint: mint,
      tokenSymbol: 'UNKNOWN',
      type: isBuy ? 'buy' : 'sell',
      solAmount,
      tokenAmount,
      price: solAmount / tokenAmount,
      signature: tx.transaction.signatures[0],
    });
  }

  return swaps;
}

function groupIntoPositions(swaps: Swap[]): Map<string, TradePosition> {
  const positions = new Map<string, TradePosition>();

  for (const swap of swaps) {
    if (!positions.has(swap.tokenMint)) {
      positions.set(swap.tokenMint, {
        tokenMint: swap.tokenMint,
        tokenSymbol: swap.tokenSymbol,
        buys: [],
        sells: [],
      });
    }

    const position = positions.get(swap.tokenMint)!;

    if (swap.type === 'buy') {
      position.buys.push({
        price: swap.price,
        amount: swap.tokenAmount,
        timestamp: swap.timestamp,
        signature: swap.signature,
      });
    } else {
      position.sells.push({
        price: swap.price,
        amount: swap.tokenAmount,
        timestamp: swap.timestamp,
        signature: swap.signature,
      });
    }
  }

  return positions;
}

async function calculatePaperhandsEvents(
  positions: Map<string, TradePosition>,
  prices: Map<string, TokenPrice>,
  metadata: Map<string, TokenMetadata>
): Promise<PaperhandsEvent[]> {
  const events: PaperhandsEvent[] = [];

  for (const [mint, position] of positions) {
    if (position.sells.length === 0) continue;

    const currentPrice = prices.get(mint)?.price || 0;
    const tokenMetadata = metadata.get(mint);

    // Sort buys and sells by timestamp
    position.buys.sort((a, b) => a.timestamp - b.timestamp);
    position.sells.sort((a, b) => a.timestamp - b.timestamp);

    // Match buys and sells (FIFO)
    let buyIndex = 0;
    let remainingBuyAmount = 0;

    for (const sell of position.sells) {
      let remainingSellAmount = sell.amount;

      while (remainingSellAmount > 0 && buyIndex < position.buys.length) {
        if (remainingBuyAmount === 0) {
          remainingBuyAmount = position.buys[buyIndex].amount;
        }

        const matchedAmount = Math.min(remainingBuyAmount, remainingSellAmount);
        const buy = position.buys[buyIndex];

        const realizedProfit = (sell.price - buy.price) * matchedAmount;
        const unrealizedProfit = (currentPrice - sell.price) * matchedAmount;
        const regretAmount = Math.max(0, unrealizedProfit);
        const regretPercent = sell.price > 0 ? ((currentPrice - sell.price) / sell.price) * 100 : 0;

        // Only record significant regrets (>$100 or >50%)
        if (regretAmount > 100 || regretPercent > 50) {
          events.push({
            id: `${mint}-${buy.timestamp}-${sell.timestamp}`,
            tokenSymbol: tokenMetadata?.symbol || 'UNKNOWN',
            tokenName: tokenMetadata?.name || 'Unknown Token',
            tokenMint: mint,
            buyPrice: buy.price,
            sellPrice: sell.price,
            buyDate: new Date(buy.timestamp).toISOString(),
            sellDate: new Date(sell.timestamp).toISOString(),
            amount: matchedAmount,
            realizedProfit,
            unrealizedProfit,
            regretAmount,
            regretPercent,
            peakPrice: currentPrice,
            marketCap: prices.get(mint)?.marketCap,
            txHash: sell.signature,
            explorerUrl: `https://solscan.io/tx/${sell.signature}`,
          });
        }

        remainingSellAmount -= matchedAmount;
        remainingBuyAmount -= matchedAmount;

        if (remainingBuyAmount === 0) {
          buyIndex++;
        }
      }
    }
  }

  return events.sort((a, b) => b.regretAmount - a.regretAmount);
}

function generateWalletStats(walletAddress: string, events: PaperhandsEvent[], daysBack: number) {
  const totalRegret = events.reduce((sum, e) => sum + e.regretAmount, 0);
  const totalEvents = events.length;
  const coinsTraded = new Set(events.map(e => e.tokenMint)).size;

  const wins = events.filter(e => e.realizedProfit > 0).length;
  const losses = events.filter(e => e.realizedProfit <= 0).length;
  const winRate = totalEvents > 0 ? (wins / totalEvents) * 100 : 0;

  const avgHoldTime = events.length > 0
    ? events.reduce((sum, e) => {
        const holdTime = (new Date(e.sellDate).getTime() - new Date(e.buyDate).getTime()) / (1000 * 60 * 60);
        return sum + holdTime;
      }, 0) / events.length
    : 0;

  // Top regretted tokens
  const tokenRegrets = new Map<string, { symbol: string; tokenMint: string; regret: number }>();
  for (const event of events) {
    const existing = tokenRegrets.get(event.tokenMint);
    if (existing) {
      existing.regret += event.regretAmount;
    } else {
      tokenRegrets.set(event.tokenMint, {
        symbol: event.tokenSymbol,
        tokenMint: event.tokenMint,
        regret: event.regretAmount,
      });
    }
  }

  const topRegrettedTokens = Array.from(tokenRegrets.values())
    .sort((a, b) => b.regret - a.regret)
    .slice(0, 5)
    .map(t => ({
      symbol: t.symbol,
      tokenMint: t.tokenMint,
      regretAmount: t.regret,
    }));

  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - daysBack * 24 * 60 * 60 * 1000);

  return {
    address: walletAddress,
    paperhandsScore: Math.min(100, totalRegret / 1000),
    totalRegret,
    totalRegretPercent: 0,
    worstLoss: events.length > 0 ? Math.max(...events.map(e => e.regretAmount)) : 0,
    totalExitedEarly: totalEvents,
    totalEvents,
    coinsTraded,
    avgHoldTime,
    avgShouldaHoldTime: 0,
    winRate,
    lossRate: 100 - winRate,
    topRegrettedTokens,
    events,
    analysisDateRange: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      daysBack,
    },
  };
}
