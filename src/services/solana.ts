/**
 * Solana Blockchain Integration Service
 * 
 * This service handles all interactions with the Solana blockchain:
 * - Fetching wallet transactions
 * - Parsing DEX swaps
 * - Getting token balances and metadata
 * - Fetching price data
 */

import { Connection, PublicKey, ParsedTransactionWithMeta } from '@solana/web3.js';
import { SOLANA_RPC_URL, JUPITER_PRICE_API, DEX_PROGRAMS, KNOWN_TOKENS, HELIUS_API_BASE, getHeliusApiKey } from '@/config/api';

interface Transaction {
  signature: string;
  blockTime: number;
  slot: number;
  err: any;
}

export type ProgressCallback = (message: string, percent: number) => void;

export interface ParsedSwap {
  signature: string;
  timestamp: number;
  tokenMint: string;
  tokenSymbol: string;
  tokenName: string;
  type: 'buy' | 'sell';
  amountIn: number;
  amountOut: number;
  pricePerToken: number;
  dex: string;
}

// Initialize Solana connection
const connection = new Connection(SOLANA_RPC_URL, 'confirmed');

/**
 * Sleep helper for rate limiting
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 5,
  baseDelay: number = 1200,
  onProgress?: ProgressCallback
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a rate limit error
      if (error?.message?.includes('429') || error?.message?.includes('Too many requests') || error?.message?.includes('rate limit')) {
        const delay = baseDelay * Math.pow(2, i);
        const waitSeconds = Math.floor(delay / 1000);
        onProgress?.(`Rate limited, waiting ${waitSeconds}s...`, undefined);
        console.log(`Rate limited, retrying in ${delay}ms... (attempt ${i + 1}/${maxRetries})`);
        await sleep(delay);
        continue;
      }
      
      // For other errors, throw immediately
      throw error;
    }
  }
  
  throw lastError;
}

/**
 * Validate a Solana address
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Fetch transactions for a wallet address with date range filtering
 */
export async function fetchWalletTransactions(
  walletAddress: string,
  daysBack?: number,
  onProgress?: ProgressCallback
): Promise<Transaction[]> {
  try {
    const cutoffTime = daysBack 
      ? Math.floor(Date.now() / 1000) - (daysBack * 24 * 60 * 60)
      : 0;
    
    const timeRangeText = daysBack ? ` (last ${daysBack} days)` : '';
    onProgress?.(`Fetching transaction history${timeRangeText}...`, 5);
    console.log(`Fetching transactions${timeRangeText} for ${walletAddress}...`);
    
    const pubkey = new PublicKey(walletAddress);
    const allSignatures: Transaction[] = [];
    let before: string | undefined = undefined;
    let batchCount = 0;
    
    // Smart pagination with date cutoff
    while (true) {
      batchCount++;
      const batchSize = 1000;
      
      const signatures = await retryWithBackoff(
        () => connection.getSignaturesForAddress(pubkey, { 
          limit: batchSize,
          before 
        }),
        5,
        1200,
        onProgress
      );
      
      if (signatures.length === 0) break;
      
      // Filter successful transactions and check cutoff
      const filtered = signatures
        .filter(sig => !sig.err && (sig.blockTime || 0) >= cutoffTime)
        .map(sig => ({
          signature: sig.signature,
          blockTime: sig.blockTime || 0,
          slot: sig.slot,
          err: sig.err,
        }));
      
      allSignatures.push(...filtered);
      
      // Stop if we hit the cutoff date
      const oldestBlockTime = signatures[signatures.length - 1]?.blockTime || 0;
      if (cutoffTime > 0 && oldestBlockTime < cutoffTime) {
        console.log(`Reached cutoff date after ${batchCount} batches`);
        break;
      }
      
      // Stop if we got fewer signatures than requested (end of history)
      if (signatures.length < batchSize) {
        break;
      }
      
      before = signatures[signatures.length - 1].signature;
      
      onProgress?.(
        `Fetching transactions${timeRangeText}... (${allSignatures.length} found)`,
        Math.min(5 + batchCount, 10)
      );
    }
    
    onProgress?.(`Found ${allSignatures.length} transactions${timeRangeText}`, 10);
    console.log(`Found ${allSignatures.length} transactions${timeRangeText}`);
    
    return allSignatures;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw new Error('Failed to fetch wallet transactions. Rate limit may be exceeded, try again in a moment.');
  }
}

/**
 * Get token metadata from Jupiter or cache
 */
const tokenMetadataCache = new Map<string, { symbol: string; name: string; logo?: string }>();

export async function getTokenMetadata(tokenMint: string): Promise<{
  symbol: string;
  name: string;
  logo?: string;
}> {
  // Check cache first
  if (tokenMetadataCache.has(tokenMint)) {
    return tokenMetadataCache.get(tokenMint)!;
  }

  // Handle known tokens
  if (tokenMint === KNOWN_TOKENS.SOL) {
    const metadata = { symbol: 'SOL', name: 'Solana', logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png' };
    tokenMetadataCache.set(tokenMint, metadata);
    return metadata;
  }
  if (tokenMint === KNOWN_TOKENS.USDC) {
    const metadata = { symbol: 'USDC', name: 'USD Coin', logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png' };
    tokenMetadataCache.set(tokenMint, metadata);
    return metadata;
  }

  try {
    // Prefer DexScreener for base token info (CORS-friendly and reliable)
    const r2 = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenMint}`);
    if (r2.ok) {
      const d2 = await r2.json();
      const base = d2?.pairs?.[0]?.baseToken;
      if (base) {
        const metadata = {
          symbol: base.symbol || tokenMint.slice(0, 6),
          name: base.name || 'Unknown Token',
          logo: `https://img.jup.ag/token/${tokenMint}`,
        };
        tokenMetadataCache.set(tokenMint, metadata);
        return metadata;
      }
    }
  } catch (e) {
    console.warn(`DexScreener metadata failed for ${tokenMint}`);
  }

  // Fallback to truncated address as symbol
  const fallback = { 
    symbol: tokenMint.slice(0, 6) + '...' + tokenMint.slice(-4), 
    name: 'Unknown Token',
    logo: `https://img.jup.ag/token/${tokenMint}`,
  };
  tokenMetadataCache.set(tokenMint, fallback);
  return fallback;
}

/**
 * Parse DEX swaps using Helius Enhanced API (preferred - accurate wallet-centric parsing)
 */
async function fetchAndParseTradesEnhanced(
  walletAddress: string,
  daysBack?: number,
  onProgress?: ProgressCallback
): Promise<ParsedSwap[]> {
  const apiKey = getHeliusApiKey();
  if (!apiKey) {
    console.warn('No Helius API key found, falling back to RPC parser');
    return [];
  }

  const cutoffTime = daysBack 
    ? Math.floor(Date.now() / 1000) - (daysBack * 24 * 60 * 60)
    : 0;
  
  const timeRangeText = daysBack ? ` (last ${daysBack} days)` : '';
  const swaps: ParsedSwap[] = [];
  let before: string | undefined = undefined;
  let batchCount = 0;

  console.log(`Using Helius Enhanced API for accurate trade parsing${timeRangeText}...`);

  while (true) {
    batchCount++;
    const url = `${HELIUS_API_BASE}/addresses/${walletAddress}/transactions?api-key=${apiKey}&limit=500${before ? `&before=${before}` : ''}`;
    
    try {
      const response = await retryWithBackoff(
        () => fetch(url).then(r => {
          if (!r.ok) throw new Error(`Helius API error: ${r.status}`);
          return r.json();
        }),
        5,
        1200,
        onProgress
      );

      if (!response || response.length === 0) break;

      console.log(`Batch ${batchCount}: Received ${response.length} transactions from Enhanced API`);

      let reachedCutoff = false;
      let parsedInBatch = 0;
      let skippedNoTokenTransfers = 0;
      let skippedNoTradedToken = 0;
      for (const tx of response) {
        const blockTime = tx.timestamp || 0;
        
        // Stop if we hit the cutoff date
        if (cutoffTime > 0 && blockTime < cutoffTime) {
          console.log(`Reached cutoff date after ${batchCount} batches`);
          reachedCutoff = true;
          break;
        }

        // Skip failed transactions
        if (tx.transactionError) continue;
        
        // Track why swaps are skipped
        if (!tx.tokenTransfers || tx.tokenTransfers.length === 0) {
          skippedNoTokenTransfers++;
          continue;
        }

        const swap = parseEnhancedTransaction(tx, walletAddress);
        if (swap) {
          swaps.push(swap);
          parsedInBatch++;
        } else {
          skippedNoTradedToken++;
        }
      }

      console.log(`Batch ${batchCount}: Parsed ${parsedInBatch} trades, skipped ${skippedNoTokenTransfers} (no token transfers), ${skippedNoTradedToken} (no valid trade) - ${swaps.length} total so far`);

      // Prepare next page and stop when less than limit
      before = response[response.length - 1]?.signature;
      if (response.length < 500 || reachedCutoff) break;
      
      onProgress?.(
        `Parsing trades${timeRangeText}... (${swaps.length} found)`,
        10 + Math.min(batchCount * 5, 80)
      );

      // Rate limiting
      await sleep(50);
    } catch (error: any) {
      console.error(`Error fetching Enhanced batch ${batchCount}:`, error?.message || error);
      break;
    }
  }

  console.log(`Found ${swaps.length} trades via Helius Enhanced API${timeRangeText}`);
  return swaps;
}

/**
 * Parse a Helius Enhanced transaction for wallet-centric token deltas
 */
function parseEnhancedTransaction(tx: any, walletAddress: string): ParsedSwap | null {
  if (!tx.tokenTransfers || tx.tokenTransfers.length === 0) {
    return null;
  }

  // Calculate net token delta for this wallet
  const tokenDeltas = new Map<string, { delta: number; decimals: number }>();
  
  for (const transfer of tx.tokenTransfers) {
    const mint = transfer.mint;
    if (!mint) continue;

    const amount = transfer.tokenAmount || 0;
    const fromWallet = transfer.fromUserAccount === walletAddress;
    const toWallet = transfer.toUserAccount === walletAddress;

    if (!fromWallet && !toWallet) continue;

    const delta = toWallet ? amount : -amount;
    const current = tokenDeltas.get(mint) || { delta: 0, decimals: transfer.decimals || 6 };
    tokenDeltas.set(mint, { 
      delta: current.delta + delta, 
      decimals: transfer.decimals || current.decimals 
    });
  }

  // Find the traded token (non-stable with largest absolute delta)
  let tradedToken: { mint: string; delta: number; decimals: number } | null = null;
  let maxAbsDelta = 0;

  for (const [mint, data] of tokenDeltas.entries()) {
    if (mint === KNOWN_TOKENS.USDC || mint === KNOWN_TOKENS.USDT) continue;
    if (Math.abs(data.delta) > maxAbsDelta) {
      maxAbsDelta = Math.abs(data.delta);
      tradedToken = { mint, ...data };
    }
  }

  if (!tradedToken || maxAbsDelta === 0) return null;

  const isBuy = tradedToken.delta > 0;
  const tokenAmount = Math.abs(tradedToken.delta);

  // Calculate value side (prefer USDC, fallback to SOL, accept token-to-token)
  let valueAmount = 0;
  const usdcDelta = tokenDeltas.get(KNOWN_TOKENS.USDC);
  const usdtDelta = tokenDeltas.get(KNOWN_TOKENS.USDT);
  
  if (usdcDelta && Math.abs(usdcDelta.delta) > 0) {
    valueAmount = Math.abs(usdcDelta.delta);
  } else if (usdtDelta && Math.abs(usdtDelta.delta) > 0) {
    valueAmount = Math.abs(usdtDelta.delta);
  } else if (tx.nativeTransfers && tx.nativeTransfers.length > 0) {
    // Sum native SOL transfers to/from wallet (excluding fees)
    let solDelta = 0;
    for (const nativeTransfer of tx.nativeTransfers) {
      const amount = nativeTransfer.amount || 0;
      const fromWallet = nativeTransfer.fromUserAccount === walletAddress;
      const toWallet = nativeTransfer.toUserAccount === walletAddress;
      
      if (toWallet) solDelta += amount;
      if (fromWallet) solDelta -= amount;
    }
    valueAmount = Math.abs(solDelta) / 1e9; // Convert lamports to SOL
  } else {
    // Token-to-token swap (no clear USDC/SOL side)
    // Look for the second largest token delta (the "value" side)
    const sortedDeltas = Array.from(tokenDeltas.entries())
      .filter(([mint]) => mint !== tradedToken.mint && mint !== KNOWN_TOKENS.SOL)
      .sort(([, a], [, b]) => Math.abs(b.delta) - Math.abs(a.delta));
    
    if (sortedDeltas.length > 0) {
      // Use the counter-token as value (will need price lookup later)
      valueAmount = Math.abs(sortedDeltas[0][1].delta);
    }
  }

  // Accept ALL trades, even with no clear value (we'll price them later)
  const pricePerToken = (tokenAmount > 0 && valueAmount > 0) ? valueAmount / tokenAmount : 0;

  // Determine DEX from events
  let dexName = 'Unknown';
  if (tx.events?.swap) {
    dexName = tx.events.swap?.protocol || tx.events.swap?.nativeInput?.account || 'DEX';
  }

  return {
    signature: tx.signature,
    timestamp: tx.timestamp * 1000,
    tokenMint: tradedToken.mint,
    tokenSymbol: '', // Will be fetched
    tokenName: '',
    type: isBuy ? 'buy' : 'sell',
    amountIn: isBuy ? valueAmount : tokenAmount,
    amountOut: isBuy ? tokenAmount : valueAmount,
    pricePerToken,
    dex: dexName,
  };
}

/**
 * Parse DEX swaps from transactions (fallback RPC method)
 */
export async function parseSwapTransactions(
  transactions: Transaction[],
  daysBack?: number,
  onProgress?: ProgressCallback
): Promise<ParsedSwap[]> {
  // Try Enhanced API first (much more accurate)
  if (transactions.length > 0 && getHeliusApiKey()) {
    try {
      const walletAddress = ''; // Will be passed from analyzePaperhands
      // Enhanced API is called directly from analyzePaperhands now
      // This is just the fallback RPC parser
    } catch (error) {
      console.warn('Enhanced API failed, using RPC fallback');
    }
  }

  const swaps: ParsedSwap[] = [];
  const total = transactions.length;
  const timeRangeText = daysBack ? ` (last ${daysBack} days)` : '';

  console.log(`Parsing ${total} transactions${timeRangeText} for coin trades (RPC fallback)...`);

  // Process in parallel batches of 10 for better performance
  const batchSize = 10;
  for (let i = 0; i < total; i += batchSize) {
    const batch = transactions.slice(i, Math.min(i + batchSize, total));
    const progress = 10 + Math.floor(((i + batch.length) / total) * 80); // 10% to 90%
    
    onProgress?.(
      `Analyzing ${i + batch.length}/${total} transactions${timeRangeText}...`,
      progress
    );

    try {
      // Process batch in parallel
      const batchPromises = batch.map(async (tx) => {
        try {
          const parsedTx = await retryWithBackoff(
            () => connection.getParsedTransaction(tx.signature, {
              maxSupportedTransactionVersion: 0
            }),
            5,
            1200,
            onProgress
          );

          if (parsedTx && parsedTx.meta && !parsedTx.meta.err) {
            return await parseTransaction(parsedTx, tx);
          }
          return null;
        } catch (error: any) {
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      const validSwaps = batchResults.filter((swap): swap is ParsedSwap => swap !== null);
      
      if (validSwaps.length > 0) {
        swaps.push(...validSwaps);
      }
      
      // Reduced delay with 50 req/sec plan
      if (i + batchSize < total) {
        await sleep(50);
      }
    } catch (error: any) {
      console.error(`Error processing batch:`, error?.message || error);
    }
  }

  console.log(`Found ${swaps.length} coin trades${timeRangeText} (${total} transactions analyzed)`);
  return swaps;
}

/**
 * Main entry point: Parse swaps with Enhanced API (preferred) or RPC fallback
 */
export async function parseSwapsWithEnhancedAPI(
  walletAddress: string,
  daysBack?: number,
  onProgress?: ProgressCallback
): Promise<ParsedSwap[]> {
  const timeRangeText = daysBack ? ` (last ${daysBack} days)` : '';

  // Run Enhanced fetch and RPC parsing in parallel, then merge
  const [enhancedSwaps, rpcSwaps] = await Promise.all([
    fetchAndParseTradesEnhanced(walletAddress, daysBack, onProgress),
    (async () => {
      const txs = await fetchWalletTransactions(walletAddress, daysBack, onProgress);
      return parseSwapTransactions(txs, daysBack, onProgress);
    })()
  ]);

  // Merge by signature, prefer Enhanced
  const bySig = new Map<string, ParsedSwap>();
  for (const s of rpcSwaps) bySig.set(s.signature, s);
  for (const s of enhancedSwaps) bySig.set(s.signature, s);
  const merged = Array.from(bySig.values());
  console.log(`Trade sources merged: Enhanced=${enhancedSwaps.length}, RPC=${rpcSwaps.length}, Combined=${merged.length}${timeRangeText}`);

  // Fetch metadata for all tokens concurrently
  if (merged.length > 0) {
    const uniqueMints = Array.from(new Set(merged.map(s => s.tokenMint)));
    const metaEntries = await Promise.all(uniqueMints.map(async (mint) => {
      const meta = await getTokenMetadata(mint);
      return [mint, meta] as const;
    }));
    const metaMap = new Map<string, { symbol: string; name: string; logo?: string }>(metaEntries);
    for (const swap of merged) {
      const m = metaMap.get(swap.tokenMint);
      if (m) {
        swap.tokenSymbol = m.symbol;
        swap.tokenName = m.name;
      }
    }
  }

  return merged;
}

/**
 * Parse a single transaction to identify swaps
 */
async function parseTransaction(
  tx: ParsedTransactionWithMeta,
  originalTx: Transaction
): Promise<ParsedSwap | null> {
  if (!tx.transaction || !tx.meta) return null;

  // Check if transaction involves a known DEX
  const programIds = tx.transaction.message.instructions
    .map((ix: any) => ix.programId?.toString())
    .filter(Boolean);

  const dexPrograms = Object.values(DEX_PROGRAMS);
  const involvedDex = programIds.find(id => dexPrograms.includes(id));
  
  if (!involvedDex) return null;

  // Analyze token balance changes
  const preBalances = tx.meta.preTokenBalances || [];
  const postBalances = tx.meta.postTokenBalances || [];

  // Find token changes (excluding SOL/WSOL)
  const tokenChanges = new Map<string, number>();

  for (const pre of preBalances) {
    if (!pre.mint) continue;
    const post = postBalances.find(p => p.accountIndex === pre.accountIndex);
    if (!post) continue;

    const preAmount = Number(pre.uiTokenAmount.uiAmount);
    const postAmount = Number(post.uiTokenAmount.uiAmount);
    const change = postAmount - preAmount;

    if (Math.abs(change) > 0.000001) { // Ignore dust
      tokenChanges.set(pre.mint, change);
    }
  }

  // Look for new token accounts (buys)
  for (const post of postBalances) {
    if (!post.mint) continue;
    const pre = preBalances.find(p => p.accountIndex === post.accountIndex);
    if (!pre && post.uiTokenAmount.uiAmount) {
      const amount = Number(post.uiTokenAmount.uiAmount);
      if (amount > 0) {
        tokenChanges.set(post.mint, amount);
      }
    }
  }

  // Filter out SOL/WSOL and stablecoins to find the traded token
  const tradedToken = Array.from(tokenChanges.entries()).find(([mint, change]) => 
    mint !== KNOWN_TOKENS.SOL && 
    mint !== KNOWN_TOKENS.USDC && 
    mint !== KNOWN_TOKENS.USDT &&
    Math.abs(change) > 0
  );

  if (!tradedToken) return null;

  const [tokenMint, tokenChange] = tradedToken;
  const isBuy = tokenChange > 0;

  // Get SOL/USDC change for price calculation
  const solChange = Math.abs(tx.meta.preBalances[0] - tx.meta.postBalances[0]) / 1e9;
  const usdcChange = tokenChanges.get(KNOWN_TOKENS.USDC) || 0;
  
  const valueChange = Math.abs(usdcChange) || solChange;
  
  // Only count coin buys/sells (must involve SOL or USDC)
  if (valueChange < 0.001) return null; // No SOL/USDC moved = not a coin trade
  
  const tokenAmount = Math.abs(tokenChange);
  const pricePerToken = tokenAmount > 0 ? valueChange / tokenAmount : 0;

  // Fetch token metadata
  const metadata = await getTokenMetadata(tokenMint);

  const dexName = Object.entries(DEX_PROGRAMS).find(([_, id]) => id === involvedDex)?.[0] || 'Unknown DEX';

  return {
    signature: originalTx.signature,
    timestamp: originalTx.blockTime * 1000,
    tokenMint,
    tokenSymbol: metadata.symbol,
    tokenName: metadata.name,
    type: isBuy ? 'buy' : 'sell',
    amountIn: isBuy ? valueChange : tokenAmount,
    amountOut: isBuy ? tokenAmount : valueChange,
    pricePerToken,
    dex: dexName,
  };
}

/**
 * Get current token balance for a wallet
 */
export async function getTokenBalance(
  walletAddress: string,
  tokenMint: string
): Promise<number> {
  try {
    const pubkey = new PublicKey(walletAddress);
    const accounts = await connection.getParsedTokenAccountsByOwner(
      pubkey,
      { mint: new PublicKey(tokenMint) }
    );

    if (accounts.value.length === 0) return 0;

    const balance = accounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
    return balance || 0;
  } catch (error) {
    console.error('Error fetching token balance:', error);
    return 0;
  }
}

/**
 * Fetch current token price from Jupiter
 */
export async function fetchCurrentTokenPrice(tokenMint: string): Promise<number> {
  // DexScreener only (more reliable for current price + market cap)
  try {
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenMint}`);
    if (response.ok) {
      const data = await response.json();
      const priceUsd = data?.pairs?.[0]?.priceUsd;
      const parsed = priceUsd ? parseFloat(priceUsd) : 0;
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
  } catch (error) {
    console.warn('DexScreener price fetch failed for', tokenMint);
  }

  return 0;
}

/**
 * Fetch token market cap from DexScreener
 */
export async function fetchTokenMarketCap(tokenMint: string): Promise<number> {
  try {
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenMint}`);
    if (response.ok) {
      const data = await response.json();
      const pairs = Array.isArray(data?.pairs) ? data.pairs : [];
      if (pairs.length === 0) return 0;
      // Prefer highest liquidity pair and take fdv or marketCap
      const best = pairs.reduce((prev: any, cur: any) => {
        const prevLiq = Number(prev?.liquidity?.usd || 0);
        const curLiq = Number(cur?.liquidity?.usd || 0);
        return curLiq > prevLiq ? cur : prev;
      }, pairs[0]);
      const cap = Number(best?.fdv || best?.marketCap || 0);
      return Number.isFinite(cap) ? cap : 0;
    }
  } catch (error) {
    console.warn('Market cap fetch failed for', tokenMint);
  }
  return 0;
}

/**
 * Get current price only (no fake estimates)
 * Returns 0 if token price unavailable
 */
export async function getCurrentPriceOnly(tokenMint: string): Promise<number> {
  return fetchCurrentTokenPrice(tokenMint);
}
