/**
 * API Configuration for Solana Integration
 * 
 * This file contains public API endpoints only.
 * All sensitive operations are handled server-side via API routes.
 */

// Public RPC URL - uses environment variable (no API key exposed)
// For client-side calls that need RPC, use the /api/rpc proxy
export const SOLANA_RPC_URL = '/api/rpc';

// Helius API base - all calls should go through server-side routes
export const HELIUS_API_BASE = '/api/helius';

// Jupiter Price API - free, no key needed
export const JUPITER_PRICE_API = 'https://price.jup.ag/v4/price';

// Birdeye API (public endpoints)
export const BIRDEYE_API_KEY = ''; // Not needed for public endpoints
export const BIRDEYE_API_URL = 'https://public-api.birdeye.so';

// Known DEX Program IDs on Solana
export const DEX_PROGRAMS = {
  JUPITER_V6: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
  JUPITER_V4: 'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB',
  RAYDIUM_V4: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
  ORCA_WHIRLPOOL: 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
  PHOENIX: 'PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY',
};

// Common token mints on Solana
export const KNOWN_TOKENS = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
};

// Get Helius API key is now server-side only
export function getHeliusApiKey(): string {
  // This should only be called from server-side code
  if (typeof window !== 'undefined') {
    console.warn('getHeliusApiKey should not be called from client-side code');
    return '';
  }
  return process.env.HELIUS_API_KEY ?? '';
}
