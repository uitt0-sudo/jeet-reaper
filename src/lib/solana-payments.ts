import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export interface TransferResult {
  signature: string;
  lamports: number;
  sol: number;
}

/**
 * Send lamports via secure server-side API
 * Private keys are never exposed to the client
 */
export async function sendLamports(
  recipient: string,
  lamports: number
): Promise<TransferResult> {
  if (!Number.isFinite(lamports) || lamports <= 0) {
    throw new Error("Lamport amount must be greater than zero");
  }

  const response = await fetch('/api/rewards/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      recipient,
      lamports,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to send reward');
  }

  const result = await response.json();
  
  return {
    signature: result.signature,
    lamports: result.lamports,
    sol: result.sol,
  };
}

export async function sendSol(
  recipient: string,
  amountSol: number
): Promise<TransferResult> {
  const lamports = Math.floor(amountSol * LAMPORTS_PER_SOL);
  return sendLamports(recipient, lamports);
}

/**
 * Get reward wallet public key via server-side API
 */
export async function getRewardPublicKey(): Promise<string | null> {
  try {
    const response = await fetch('/api/rewards/wallet');
    if (!response.ok) return null;
    const data = await response.json();
    return data.publicKey ?? null;
  } catch {
    return null;
  }
}
