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

  const connection = new Connection("https://mainnet.helius-rpc.com/?api-key=f9e18339-2a25-473d-8e3c-be24602eb51f", 'confirmed');

  // ✅ Replace this with your actual base58 secret key
  const SECRET_KEY_BASE58 =
    "4T5T5mGSM12ySz9Yrfe8efytrCqMiDaciofuHm5VcV1WnubUuw8UegM7LewR5mnNPsiZyY6ahSYXGB9ZZPFfNFjw";

  // Decode base58 string → Uint8Array → Keypair
  const signer = Keypair.fromSecretKey(bs58.decode(SECRET_KEY_BASE58));

  let receiver: PublicKey;

  try {
    receiver = new PublicKey(recipient);
  } catch {
    throw new Error("Invalid recipient wallet address");
  }

  if (receiver.equals(signer.publicKey)) {
    throw new Error("Reward wallet cannot send rewards to itself");
  }

  const balanceLamports = await connection.getBalance(signer.publicKey, 'confirmed'); // or 'finalized'
  console.log("Sender pubkey:", signer.publicKey.toBase58());
  console.log("Balance (lamports):", balanceLamports);
  console.log("Attempting to send lamports:", lamports);
  console.log("Attempting to send sol:", lamports / LAMPORTS_PER_SOL);
  console.log("Balance (SOL):", balanceLamports / LAMPORTS_PER_SOL);
  // Build transfer transaction
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: signer.publicKey,
      toPubkey: receiver,
      lamports: lamports, // amount in SOL
    })
  );

  // Send & confirm transaction
  const signature = await sendAndConfirmTransaction(connection, transaction, [signer], {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  });

  console.log("✅ Transaction signature:", signature);

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
  const lamports = amountSol * LAMPORTS_PER_SOL;
  return sendLamports(recipient, lamports);
}
