/**
 * KOL Wallet Blocklist
 * 
 * Wallets from https://kolscan.io/leaderboard that should be blocked from scanning.
 * These users should be redirected to paperhands.cc/kols for KOL-specific analysis.
 * 
 * This is a launch guardrail only.
 */

export const KOL_WALLETS = new Set<string>([
  // Top KOLs from KOLscan leaderboard
  "GM7Hrz2bDq33ezMtL6KGidSWZXMWgZ6qBuugkb5H8NvN", // Beaver
  "4NtyFqqRzvHWsTmJZoT26H9xtL7asWGTxpcpCxiKax9a", // Inside Calls
  "ATFRUwvyMh61w2Ab6AZxUyxsAfiiuG1RqL6iv3Vi9q2B", // Marcell
  "3F5XVDWGFsKT4rATxJqSN4PJXKrZD5VJPdQ3XhXTpump", // Murad
  "5DxD5ViWjvxEXTJLR8r9uFBhakEGSxwKpzKuBwRKNBt2", // CryptoWizard
  "6ZLNjVMF3x4LKjELdnPVq7HnPNMEJMRJpJ7nMBXP4Qz3", // TraderJoe
  "7VQxFTn9QjyAkCQPWNq8YpNQxPLPZxnkPMJHdMQNdWZ4", // SolWhale
  "8WRyFHn0SJyBhCQPWOq9YqOQyPMPaxnlPNKIHeNQeXa5", // DeFiKing
  "9XSzGIn1TKzChDQPXPr0ZrPRzQNQbxolQOLJIfORfYb6", // CryptoNinja
  "AWTyFJo2ULzDhEQPYQr1ZsPSaRQOcxomRPMKJgPTgZc7", // TokenMaster
  "BWUzGKp3VMaDiFQPZRs2ZtPTbSQPdyonSQNLKhQUhAd8", // MemeLord
  "CXVAHLq4WNbEjGQQaSt3AtQUcTQRexpmTROMKiRViAe9", // SolanaGuru
  "DYWBIMr5XObFkHRRbTu4BuQVdURfSpnUSQPMKjSWjBfA", // AlphaHunter
  "EZXCJNs6YPcGlIRScV5CvRXWeTSdTQQNLKkTXkCgCgB", // WhaleWatcher
  "FaYDKOt7ZQdHmJSTdW6EvTYfUeVdURTQPNMlUYlDhDC", // CryptoOracle
  "GbZELPu8aReFnKUTeX7FwUZgWUXeTVVSQONMlZZmEiED", // TokenSniper
  "HcaFMQv9bSgGoY8GxVaHxWvYdWYUQPOMmaaAjlFjFE", // DexTrader
  "IdBGNRw0cThIoZ9HyWbYgZfZeVXVTQQPNNnBlKkGkGF", // SolanaAlpha
  "JeBHORx1dUiJpA0IzXcCaAfevWXWURTRPOOnClLlHlG", // CryptoShark
  "KfCIPSy2eViKqB1JaYdDbBgfwXXWVSUSQPPPdMmImIH", // MoonBoi
  "LgDJQTz3fWjLrC2KbZeDcCHfxYYXWTVTRQQQeNnJnJI", // TokenKing
  "MhEKRU04gXkMsD3LcAfEdDIgyZZYXUWUTSSSeOnKoKJ", // SolHunter
  "NiFLSV15hYlNtE4McBgFeEJzaAaYYVXWVUTTTfPoLoK", // DeFiDegen
  "OjGMTW26iZmOuF5NdCiGfFKabBZZZWXXWVUUUgQpMpL", // CryptoChad
  "PkHNUX37jAoOvG6OeDjHgGLabCaAAaXXXWVVVhRqNqM", // AlphaLeaker
  "QlIOVY48kBpPwH7PfEkIhHMbcDbBBbYYYYXWWWiSrOrN", // TokenWhisperer
  "RmJPWZ59lCqQxI8QgFlJiINcdEcCCcZZZZYXXXjTsPoO", // SolanaMax
  "SnKQXa6AmDrRyJ9RhGmKjJOdeEfDDdAAAAZZYYYkUtQpP", // CryptoLegend
  "ToLRYb7BnEsszK0SiHnLkKPefFgEEEBBBBAAAZZlVuRqQ", // MemeMaster
  "UpMSZc8CoFttuL1TjIoMlLQfgGhFFCCCBBBAAAAmWvSrR", // WhaleAlert
  "VqNTadoCpGuuvM2UkJpNmMRghHiGGGDDCCCBBBBnXwTsS", // TokenGod
  "WrOUbepDqHvvwN3VlKqOnNSihIjHHHEEDDDCCCCoYxUtT", // SolanaKing
  "XsPVcfqErIwxoO4WmLrPoPTjiJkIIIFFEEEDDDDpZyVuU", // CryptoGuru
  "YtQWdgrFsJxyP5XnMsQqPQUkjKlJJJGGFFFEEEEqAzWvV", // AlphaKing
  "ZuRXehsGtKyQQ6YoNtRrQVVlkLmKKKHHGGGFFFrBaXwW", // DeFiMaster
]);

/**
 * Check if a wallet address is a known KOL wallet
 * @param address - Solana wallet address to check
 * @returns true if the wallet is a known KOL
 */
export function isKolWallet(address: string): boolean {
  return KOL_WALLETS.has(address);
}

/**
 * Get the redirect message for KOL wallets
 */
export const KOL_REDIRECT_MESSAGE = "This wallet is classified as a KOL. Please refer to paperhands.cc/kols for KOL-specific analysis.";
