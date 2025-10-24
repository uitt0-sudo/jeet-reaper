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
  tokenLogo?: string;
  tokenLogos?: string[];
  type: 'buy' | 'sell';
  amountIn: number;
  amountOut: number;
  pricePerToken: number;
  dex: string;
}

// Initialize Solana connection
const connection = new Connection(SOLANA_RPC_URL, 'confirmed');

const HELIUS_DEFAULT_PAGE_SIZE = 500;
const HELIUS_MIN_PAGE_SIZE = 100;

/**
 * Sleep helper for rate limiting
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry with exponential backoff
 */
interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  onProgress?: ProgressCallback;
  isRetryable?: (error: unknown) => boolean;
  onRetry?: (attempt: number, delayMs: number, error: unknown, reason: string) => void;
}

const defaultRetryable = (error: unknown) => {
  const message = (error as Error)?.message?.toLowerCase() ?? '';
  const status = typeof (error as any)?.status === 'number' ? (error as any).status : undefined;
  if (status) {
    if (status === 429) return true;
    if (status >= 500 || status === 408) return true;
  }
  return (
    message.includes('429') ||
    message.includes('too many requests') ||
    message.includes('rate limit') ||
    message.includes('timed out') ||
    message.includes('timeout') ||
    message.includes('fetch failed') ||
    message.includes('network error')
  );
};

async function retryWithBackoff<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { maxRetries = 5, baseDelay = 1200, onProgress, isRetryable = defaultRetryable, onRetry } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const shouldRetry = isRetryable(error);
      if (!shouldRetry || attempt === maxRetries - 1) {
        break;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      const seconds = Math.max(1, Math.round(delay / 1000));
      const message = (error as Error)?.message || 'unknown error';
      const reason = message.includes('429') || (error as any)?.status === 429
        ? 'rate limited'
        : `transient error (${message})`;

      onRetry?.(attempt + 1, delay, error, reason);
      if (!onRetry) {
        if (reason === 'rate limited') {
          onProgress?.(`Rate limited, waiting ${seconds}s...`, undefined);
        } else {
          onProgress?.(`Retrying after ${seconds}s due to ${reason}`, undefined);
        }
      }

      console.warn(`Retrying in ${delay}ms due to ${reason} (attempt ${attempt + 1}/${maxRetries})`);
      await sleep(delay);
    }
  }

  throw lastError;
}

class HeliusApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'HeliusApiError';
    this.status = status;
    this.details = details;
  }
}

interface HeliusPageOptions {
  walletAddress: string;
  apiKey: string;
  before?: string;
  limit: number;
  onProgress?: ProgressCallback;
}

async function parseHeliusErrorResponse(response: Response): Promise<{ message: string; details?: unknown }> {
  let text: string | undefined;
  let body: unknown;

  try {
    text = await response.text();
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    }
  } catch (error) {
    console.warn('Failed to read Helius error response body:', error);
  }

  let message = `Helius request failed with status ${response.status}`;

  if (typeof body === 'string' && body.trim().length > 0) {
    message = body;
  } else if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    const candidates = [record.message, record.error, record.errorMessage];
    const found = candidates.find((value): value is string => typeof value === 'string' && value.trim().length > 0);
    if (found) {
      message = found;
    }
  }

  return {
    message,
    details: body,
  };
}

async function fetchHeliusTransactionsPage({
  walletAddress,
  apiKey,
  before,
  limit,
  onProgress,
}: HeliusPageOptions): Promise<any[]> {
  const url = new URL(`${HELIUS_API_BASE}/addresses/${walletAddress}/transactions`);
  url.searchParams.set('api-key', apiKey);
  url.searchParams.set('limit', limit.toString());
  if (before) {
    url.searchParams.set('before', before);
  }

  return retryWithBackoff(
    async () => {
      let response: Response;
      try {
        response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            accept: 'application/json',
          },
        });
      } catch (networkError) {
        throw new HeliusApiError(0, 'Failed to reach Helius API', networkError);
      }

      if (!response.ok) {
        const { message, details } = await parseHeliusErrorResponse(response);
        throw new HeliusApiError(response.status, message, details);
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new HeliusApiError(
          500,
          'Helius response format unexpected (expected array of transactions)',
          data
        );
      }

      return data;
    },
    {
      maxRetries: 4,
      baseDelay: 1500,
      onProgress,
      isRetryable: (error) => {
        if (error instanceof HeliusApiError) {
          if (error.status === 400 || error.status === 401 || error.status === 403) return false;
          if (error.status === 0) return true; // network failure
          if (error.status === 429) return true;
          if (error.status >= 500 || error.status === 408) return true;
          return false;
        }
        return defaultRetryable(error);
      },
      onRetry: (attempt, delay, error, reason) => {
        if (error instanceof HeliusApiError && error.status === 429) {
          const seconds = Math.max(1, Math.round(delay / 1000));
          onProgress?.(`Helius rate limited, retrying in ${seconds}s...`, undefined);
        } else {
          const seconds = Math.max(1, Math.round(delay / 1000));
          onProgress?.(`Retrying Helius request in ${seconds}s due to ${reason}`, undefined);
        }
      },
    }
  );
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
        {
          maxRetries: 5,
          baseDelay: 1200,
          onProgress,
        }
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
const tokenMetadataCache = new Map<string, { symbol: string; name: string; logo?: string; logos?: string[] }>();

export async function getTokenMetadata(tokenMint: string): Promise<{
  symbol: string;
  name: string;
  logo?: string;
  logos?: string[];
}> {
  // Check cache first
  if (tokenMetadataCache.has(tokenMint)) {
    return tokenMetadataCache.get(tokenMint)!;
  }

  // Handle known tokens
  if (tokenMint === KNOWN_TOKENS.SOL) {
    const logo = 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png';
    const metadata = { symbol: 'SOL', name: 'Solana', logo, logos: [logo] };
    tokenMetadataCache.set(tokenMint, metadata);
    return metadata;
  }
  if (tokenMint === KNOWN_TOKENS.USDC) {
    const logo = 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png';
    const metadata = { symbol: 'USDC', name: 'USD Coin', logo, logos: [logo] };
    tokenMetadataCache.set(tokenMint, metadata);
    return metadata;
  }

  // Try Helius first, then fallbacks
  const metadata = await getTokenMetadataWithHelius(tokenMint);
  tokenMetadataCache.set(tokenMint, metadata);
  return metadata;
}

async function getTokenMetadataWithHelius(tokenMint: string): Promise<{
  symbol: string;
  name: string;
  logo?: string;
  logos?: string[];
}> {
  const sources = [
    getHeliusMetadata(tokenMint), // Primary source
    getJupiterStrictMetadata(tokenMint), // Fallback 1
    getBirdeyeMetadata(tokenMint), // Fallback 2
    getSolanaTokenListMetadata(tokenMint), // Fallback 3
  ];

  try {
    // Try Helius first with short timeout
    const heliusResult = await Promise.race([
      getHeliusMetadata(tokenMint),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Helius timeout')), 2000)
      )
    ]);
    
    // If Helius has good data with logo, return immediately
    if (heliusResult.logo || heliusResult.logos?.length) {
      return heliusResult;
    }

    // If Helius has data but no logo, try other sources for logos only
    console.log(`Helius found metadata for ${tokenMint} but no logo, checking other sources...`);
    const fallbackSources = sources.slice(1);
    const fallbackResults = await Promise.allSettled(fallbackSources);
    
    const logos = collectLogosFromResults([{ status: 'fulfilled', value: heliusResult }, ...fallbackResults]);
    
    return {
      symbol: heliusResult.symbol,
      name: heliusResult.name,
      logo: logos[0],
      logos: logos.length > 0 ? logos : undefined,
    };

  } catch (error) {
    // Helius failed or timed out, try all sources in parallel
    console.log(`Helius primary failed for ${tokenMint}, trying all sources...`);
    return getAllSourcesFallback(tokenMint, sources);
  }
}

async function getAllSourcesFallback(tokenMint: string, sources: Promise<any>[]) {
  try {
    const results = await Promise.race([
      Promise.allSettled(sources),
      new Promise<PromiseSettledResult<any>[]>((resolve) => 
        setTimeout(() => resolve([]), 3000)
      )
    ]);

    const successfulResults = results
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
      .map(result => result.value)
      .filter(metadata => metadata && metadata.symbol && metadata.name);

    if (successfulResults.length === 0) {
      return generateFallback(tokenMint);
    }

    // Find the best result (prioritize those with logos)
    const resultsWithLogos = successfulResults.filter(r => r.logo || r.logos?.length);
    const bestResult = resultsWithLogos.length > 0 ? resultsWithLogos[0] : successfulResults[0];
    
    // Collect all unique logos from all successful results
    const allLogos = collectLogosFromResults(results);
    
    return {
      symbol: bestResult.symbol,
      name: bestResult.name,
      logo: allLogos[0] || bestResult.logo,
      logos: allLogos.length > 0 ? allLogos : undefined,
    };
  } catch (error) {
    return generateFallback(tokenMint);
  }
}

function collectLogosFromResults(results: PromiseSettledResult<any>[]): string[] {
  const logos = new Set<string>();
  
  results.forEach(result => {
    if (result.status === 'fulfilled') {
      const value = result.value;
      if (value?.logo) logos.add(value.logo);
      if (value?.logos) {
        value.logos.forEach((logo: string) => {
          if (logo && typeof logo === 'string') logos.add(logo);
        });
      }
    }
  });

  return Array.from(logos).filter(logo => 
    logo && logo.length > 5 && !logo.includes('undefined')
  );
}

// 1. Helius Primary Source
async function getHeliusMetadata(tokenMint: string) {
  const HELIUS_API_KEY = 'f9e18339-2a25-473d-8e3c-be24602eb51f'; 
  
  try {
    const response = await fetch(`https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: '1',
        method: 'getAsset',
        params: {
          id: tokenMint,
          displayOptions: {
            showCollectionMetadata: true,
            showUnverifiedCollections: false,
            showNativeBalance: false,
            showInscription: false,
          }
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Helius HTTP error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Helius API error: ${data.error.message}`);
    }

    const asset = data.result;
    
    if (asset) {
      const symbol = asset.symbol || asset.content?.metadata?.symbol || tokenMint.slice(0, 6);
      const name = asset.name || asset.content?.metadata?.name || `Token ${tokenMint.slice(0, 6)}`;
      
      // Helius provides multiple logo sources
      const heliusLogos = [
        asset.content?.links?.image, // Primary image
        asset.image, // Legacy field
        asset.logo, // Legacy field
      ].filter((url): url is string => 
        typeof url === 'string' && url.length > 5 && !url.includes('undefined')
      );

      // Add standard logo candidates
      const allLogos = Array.from(new Set([
        ...heliusLogos,
        ...buildStandardLogoCandidates(tokenMint),
      ]));

      return {
        symbol,
        name,
        logo: allLogos[0],
        logos: allLogos,
      };
    }

    throw new Error('Helius no asset data');
  } catch (error) {
    console.warn(`Helius metadata failed for ${tokenMint}:`, error instanceof Error ? error.message : error);
    throw error;
  }
}

// 2. Jupiter Strict Token List (high quality verified tokens)
async function getJupiterStrictMetadata(tokenMint: string) {
  try {
    const response = await fetch('https://token.jup.ag/strict');
    const tokenList = await response.json();
    
    const token = tokenList.find((t: any) => t.address === tokenMint);
    if (token) {
      const logos = token.logoURI ? [token.logoURI] : [];
      return {
        symbol: token.symbol,
        name: token.name,
        logo: token.logoURI,
        logos,
      };
    }
  } catch (error) {
    console.warn(`Jupiter strict list failed for ${tokenMint}`);
  }
  throw new Error('Jupiter failed');
}

// 3. Birdeye API (fallback)
async function getBirdeyeMetadata(tokenMint: string) {
  try {
    const response = await fetch(`https://public-api.birdeye.so/defi/token_overview?address=${tokenMint}`, {
      headers: {
        'X-API-KEY': 'your-birdeye-api-key-here', // Optional but recommended
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.data?.symbol) {
        const logo = data.data.logoURI || data.data.logo;
        const logos = logo ? [logo] : [];
        
        return {
          symbol: data.data.symbol,
          name: data.data.name || data.data.symbol,
          logo,
          logos,
        };
      }
    }
  } catch (error) {
    console.warn(`Birdeye metadata failed for ${tokenMint}`);
  }
  throw new Error('Birdeye failed');
}

// 4. Solana Token List (community maintained)
async function getSolanaTokenListMetadata(tokenMint: string) {
  try {
    const response = await fetch('https://cdn.jsdelivr.net/gh/solana-labs/token-list@main/src/tokens/solana.tokenlist.json');
    const tokenList = await response.json();
    
    const token = tokenList.tokens.find((t: any) => t.address === tokenMint);
    if (token) {
      return {
        symbol: token.symbol,
        name: token.name,
        logo: token.logoURI,
        logos: token.logoURI ? [token.logoURI] : [],
      };
    }
  } catch (error) {
    console.warn(`Solana token list failed for ${tokenMint}`);
  }
  throw new Error('Solana token list failed');
}

function generateFallback(tokenMint: string) {
  const fallbackLogos = buildStandardLogoCandidates(tokenMint);
  return {
    symbol: tokenMint.slice(0, 6) + '...' + tokenMint.slice(-4),
    name: 'Unknown Token',
    logo: fallbackLogos[0],
    logos: fallbackLogos,
  };
}

function buildStandardLogoCandidates(tokenMint: string): string[] {
  return [
    `https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${tokenMint}/logo.png`,
    `https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${tokenMint}/logo.svg`,
    `https://pump.fun/cdn/${tokenMint}/logo.png`,
    `https://pump.fun/cdn/${tokenMint}/logo.webp`,
  ].filter(url => url && url.length > 0);
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
  let pageLimit = HELIUS_DEFAULT_PAGE_SIZE;
  let retryCurrentBatch = false;
  let repeated400Errors = 0;

  console.log(`Using Helius Enhanced API for accurate trade parsing${timeRangeText}...`);

  while (true) {
    if (!retryCurrentBatch) {
      batchCount++;
    }
    retryCurrentBatch = false;
    
    try {
      const response = await fetchHeliusTransactionsPage({
        walletAddress,
        apiKey,
        before,
        limit: pageLimit,
        onProgress,
      });

      if (!response || response.length === 0) {
        break;
      }

      console.log(`Batch ${batchCount}: Received ${response.length} transactions from Enhanced API`);
      repeated400Errors = 0;

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
      const lastSignature = response[response.length - 1]?.signature;
      if (!lastSignature || lastSignature === before) {
        console.log('No new signature returned from Helius, stopping pagination');
        break;
      }
      before = lastSignature;

      if (response.length < pageLimit || reachedCutoff) break;
      
      onProgress?.(
        `Parsing trades${timeRangeText}... (${swaps.length} found)`,
        10 + Math.min(batchCount * 5, 80)
      );

      // Rate limiting
      await sleep(50);
    } catch (error: any) {
      if (error instanceof HeliusApiError) {
        console.error(
          `Helius error on batch ${batchCount} (status ${error.status}):`,
          error.message,
          error.details || ''
        );

        if (error.status === 400) {
          repeated400Errors++;
          if (pageLimit > HELIUS_MIN_PAGE_SIZE) {
            const newLimit = Math.max(HELIUS_MIN_PAGE_SIZE, Math.floor(pageLimit / 2));
            if (newLimit < pageLimit) {
              console.warn(`Reducing Helius page size from ${pageLimit} to ${newLimit} due to 400 error`);
              onProgress?.(
                `Helius rejected page size ${pageLimit}. Retrying with ${newLimit} transactions...`,
                undefined
              );
              pageLimit = newLimit;
              retryCurrentBatch = true;
              await sleep(100);
              continue;
            }
          }

          if (repeated400Errors >= 2) {
            onProgress?.(
              'Helius refused further pages. Falling back to RPC parser for remaining history.',
              undefined
            );
            console.warn('Stopping Enhanced pagination after repeated 400 errors');
            break;
          }
        } else if (error.status === 401 || error.status === 403) {
          const message = 'Helius API key was rejected. Please verify your API key and try again.';
          onProgress?.(message, undefined);
          throw new Error(message);
        } else if (error.status === 404) {
          onProgress?.('Helius reports no transactions for this wallet.', undefined);
          break;
        } else if (error.status === 0) {
          onProgress?.('Network error contacting Helius. Falling back to RPC parser.', undefined);
          break;
        } else {
          onProgress?.(`Helius returned error ${error.status}. Using RPC fallback for safety.`, undefined);
          break;
        }
      } else {
        console.error(`Unexpected error fetching Enhanced batch ${batchCount}:`, error?.message || error);
      }
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
            {
              maxRetries: 5,
              baseDelay: 1200,
              onProgress,
            }
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

  // Run Enhanced fetch and RPC parsing in parallel with robust error handling
  const [enhancedResult, rpcResult] = await Promise.allSettled([
    fetchAndParseTradesEnhanced(walletAddress, daysBack, onProgress),
    (async () => {
      const txs = await fetchWalletTransactions(walletAddress, daysBack, onProgress);
      return parseSwapTransactions(txs, daysBack, onProgress);
    })(),
  ]);

  let enhancedSwaps: ParsedSwap[] = [];
  let rpcSwaps: ParsedSwap[] = [];
  let enhancedError: unknown = null;
  let rpcError: unknown = null;

  if (enhancedResult.status === 'fulfilled') {
    enhancedSwaps = enhancedResult.value;
  } else {
    enhancedError = enhancedResult.reason;
    console.warn('Helius Enhanced parsing failed:', enhancedError);
    onProgress?.('Helius Enhanced API unavailable. Continuing with RPC data…', undefined);
  }

  if (rpcResult.status === 'fulfilled') {
    rpcSwaps = rpcResult.value;
  } else {
    rpcError = rpcResult.reason;
    console.warn('RPC fallback parsing failed:', rpcError);
    onProgress?.('Solana RPC requests failed. Attempting to continue with partial Helius data…', undefined);
  }

  if (enhancedSwaps.length === 0 && rpcSwaps.length === 0) {
    const message =
      (enhancedError instanceof Error && enhancedError.message) ||
      (rpcError instanceof Error && rpcError.message) ||
      'Unable to retrieve trades from Solana. Please try again shortly.';
    throw new Error(message);
  }

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
    const metaMap = new Map<string, Awaited<ReturnType<typeof getTokenMetadata>>>(metaEntries);
    for (const swap of merged) {
      const m = metaMap.get(swap.tokenMint);
      if (m) {
        swap.tokenSymbol = m.symbol;
        swap.tokenName = m.name;
        swap.tokenLogo = m.logo ?? swap.tokenLogo;
        if (m.logos && m.logos.length > 0) {
          const existing = new Set(swap.tokenLogos ?? []);
          for (const logo of m.logos) {
            if (logo) existing.add(logo);
          }
          swap.tokenLogos = Array.from(existing);
        } else if (m.logo && (!swap.tokenLogos || swap.tokenLogos.length === 0)) {
          swap.tokenLogos = [m.logo];
        }
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
