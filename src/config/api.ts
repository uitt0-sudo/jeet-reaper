/**
 * API Configuration for Solana Integration
 * 
 * This file contains all API endpoints and keys needed for the application.
 * 
 * Note: In a frontend-only app, API keys will be visible in the browser.
 * This is acceptable for free-tier services with rate limiting.
 * For production apps with sensitive keys, consider adding a backend proxy.
 */

// Helius RPC endpoint - provides enhanced Solana transaction parsing
export const SOLANA_RPC_URL = 'https://mainnet.helius-rpc.com/?api-key=f9e18339-2a25-473d-8e3c-be24602eb51f';

// Extract Helius API key from RPC URL
export function getHeliusApiKey(): string {
  const match = SOLANA_RPC_URL.match(/api-key=([^&]+)/);
  return match ? match[1] : '';
}

// Helius Enhanced Transactions API
export const HELIUS_API_BASE = 'https://api.helius.xyz/v0';

// Jupiter Price API - free, no key needed
export const JUPITER_PRICE_API = 'https://price.jup.ag/v4/price';

// Optional: Birdeye for historical price data (recommended for production)
// Sign up at https://birdeye.so/ for accurate historical prices
export const BIRDEYE_API_KEY = ''; // Add your Birdeye API key here
export const BIRDEYE_API_URL = 'https://public-api.birdeye.so';

// Known DEX Program IDs on Solana
export const DEX_PROGRAMS = {
  JUPITER_V6: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
  JUPITER_V4: 'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB',
  RAYDIUM_V4: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
  ORCA_WHIRLPOOL: 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
  PHOENIX: 'PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY',
  PUMP_FUN: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
};

// Common token mints on Solana
export const KNOWN_TOKENS = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
};
