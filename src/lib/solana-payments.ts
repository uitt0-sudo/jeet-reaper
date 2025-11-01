import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import bs58 from "bs58";

import { SOLANA_RPC_URL } from "@/config/api";

const connection = new Connection(SOLANA_RPC_URL, "confirmed");

let cachedSigner: Keypair | null = null;

function parseSecretKey(secret: string): Uint8Array {
  const trimmed = secret.trim();
  if (!trimmed) {
    throw new Error("Reward wallet secret key is empty");
  }

  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as number[];
      return Uint8Array.from(parsed);
    } catch {
      throw new Error("Failed to parse reward wallet secret key JSON");
    }
  }

  if (trimmed.includes(",")) {
    const parts = trimmed
      .split(",")
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isFinite(value));
    return Uint8Array.from(parts);
  }

  try {
    return Uint8Array.from(bs58.decode(trimmed));
  } catch {
    throw new Error(
      "Failed to decode reward wallet secret key - ensure it is Base58 or JSON encoded"
    );
  }
}

function getRewardSigner(): Keypair {
  if (cachedSigner) {
    return cachedSigner;
  }

  const secret =
    process.env.REWARD_WALLET_SECRET_KEY ??
    process.env.REWARD_WALLET_PRIVATE_KEY ??
    process.env.REWARD_WALLET_SECRET ??
    "";

  if (!secret.trim()) {
    throw new Error(
      "Reward wallet secret key not configured. Set REWARD_WALLET_SECRET_KEY."
    );
  }

  const secretKey = parseSecretKey(secret);
  if (secretKey.length !== 64) {
    throw new Error("Reward wallet secret key must decode to 64 bytes");
  }

  cachedSigner = Keypair.fromSecretKey(secretKey);
  return cachedSigner;
}

export interface TransferResult {
  signature: string;
  lamports: number;
  sol: number;
}

export function getRewardPublicKey(): PublicKey {
  return getRewardSigner().publicKey;
}

export async function sendLamports(
  recipient: string,
  lamports: number
): Promise<TransferResult> {
  if (!Number.isFinite(lamports) || lamports <= 0) {
    throw new Error("Lamport amount must be greater than zero");
  }

  const signer = getRewardSigner();
  let receiver: PublicKey;

  try {
    receiver = new PublicKey(recipient);
  } catch {
    throw new Error("Invalid recipient wallet address");
  }

  if (receiver.equals(signer.publicKey)) {
    throw new Error("Reward wallet cannot send rewards to itself");
  }

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: signer.publicKey,
      toPubkey: receiver,
      lamports,
    })
  );

  let signature: string;
  try {
    signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [signer],
      {
        commitment: "confirmed",
        preflightCommitment: "confirmed",
      }
    );
  } catch (error) {
    console.error("Failed to send Solana transfer", error);
    if (error instanceof Error && error.message) {
      throw new Error(error.message);
    }
    throw new Error("Unknown error sending Solana transfer");
  }

  return {
    signature,
    lamports,
    sol: lamports / LAMPORTS_PER_SOL,
  };
}

export async function sendSol(
  recipient: string,
  amountSol: number
): Promise<TransferResult> {
  const lamports = Math.max(1, Math.round(amountSol * LAMPORTS_PER_SOL));
  return sendLamports(recipient, lamports);
}
