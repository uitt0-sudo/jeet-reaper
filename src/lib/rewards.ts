import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import {
  CASHBACK_PERCENTAGE,
  MINIMUM_HOLDING,
  RANDOM_REWARD_RANGE,
} from "@/config/rewards";

import { Connection, Keypair, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import bs58 from "bs58";

const TOKEN_MINT_ADDRESS = import.meta.env.VITE_TOKEN_MINT_ADDRESS ?? "";
const HELIUS_API_KEY = import.meta.env.VITE_HELIUS_API_KEY ?? "";

type TokenBalanceAmount = {
  amount?: string;
  decimals?: number;
};

type TokenBalanceEntry = {
  mint?: string;
  tokenAddress?: string;
  uiAmount?: number;
  amount?: number | string;
  decimals?: number;
  tokenAmount?: TokenBalanceAmount;
  uiTokenAmount?: {
    uiAmount?: number;
    amount?: string;
    decimals?: number;
  };
};

type TokenBalanceResponse =
  | TokenBalanceEntry[]
  | {
    tokens?: TokenBalanceEntry[];
  };

export interface RewardStatus {
  holder?: Tables<"wallet_holders"> | null;
  randomReward?: {
    amount: number;
    claimed_at: string | null;
    transaction_signature: string | null;
  } | null;
  cashback?: {
    amount: number;
    claimed_at: string | null;
    transaction_signature: string | null;
  } | null;
}

export interface RewardActionResult {
  amount: number;
  type: "random" | "cashback";
  status: RewardStatus;
  signature?: string | null;
}

function randomInRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function parseTokenBalance(entry?: TokenBalanceEntry | null): number {
  if (!entry) return 0;

  if (typeof entry.uiAmount === "number") {
    return entry.uiAmount;
  }

  const uiTokenAmount = entry.uiTokenAmount;
  if (uiTokenAmount && typeof uiTokenAmount.uiAmount === "number") {
    return uiTokenAmount.uiAmount;
  }

  const decimals =
    typeof entry.decimals === "number"
      ? entry.decimals
      : typeof uiTokenAmount?.decimals === "number"
        ? uiTokenAmount.decimals
        : typeof entry.tokenAmount?.decimals === "number"
          ? entry.tokenAmount.decimals
          : 0;

  const rawAmount =
    typeof entry.amount === "number"
      ? entry.amount
      : typeof entry.amount === "string"
        ? Number(entry.amount)
        : typeof entry.tokenAmount?.amount === "string"
          ? Number(entry.tokenAmount.amount)
          : null;

  if (rawAmount === null || !Number.isFinite(rawAmount)) {
    return 0;
  }

  return decimals > 0 ? rawAmount / Math.pow(10, decimals) : rawAmount;
}

export async function fetchTokenHoldings(
  walletAddress: string
): Promise<number> {
  if (!walletAddress || !HELIUS_API_KEY || !TOKEN_MINT_ADDRESS) {
    return 0;
  }

  const url = `https://api.helius.xyz/v0/addresses/${walletAddress}/balances?api-key=${encodeURIComponent(
    HELIUS_API_KEY
  )}`;

  const response = await fetch(url);
  if (!response.ok) {
    console.error(await response.text());
    throw new Error("Failed to fetch token balances");
  }

  const payload = (await response.json()) as {
    tokens: Array<{
      tokenAccount: string;
      mint: string;
      amount: number | string;
      decimals: number;
    }>;
    nativeBalance: number;
  };

  if (!payload?.tokens?.length) return 0;

  const match = payload.tokens.find(
    (token) =>
      token.mint === TOKEN_MINT_ADDRESS ||
      token.tokenAccount === TOKEN_MINT_ADDRESS
  );

  if (!match) {
    return 0;
  }

  const amount = Number(match.amount) / Math.pow(10, match.decimals);
  return amount;
}

async function getWalletHolder(
  walletAddress: string
): Promise<Tables<"wallet_holders"> | null> {
  const { data, error } = await supabase
    .from("wallet_holders")
    .select("*")
    .eq("wallet_address", walletAddress)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    console.error("Failed to load wallet holder", error);
    throw error;
  }

  return data ?? null;
}

async function updateWalletHolderAggregate(
  walletAddress: string,
  adjustments: {
    holdings?: number;
    rewardDelta?: number;
    cashbackDelta?: number;
    randomRewardClaimed?: boolean;
    cashbackClaimed?: boolean;
    lastRewardAt?: string;
    lastCashbackAt?: string;
    lastScan?: string;
  } = {}
) {
  const existing = await getWalletHolder(walletAddress);

  const rewardDelta = adjustments.rewardDelta ?? 0;
  const cashbackDelta = adjustments.cashbackDelta ?? 0;

  const totalRewards = (existing?.total_rewards ?? 0) + rewardDelta;
  const totalCashback = (existing?.total_cashback ?? 0) + cashbackDelta;

  const randomRewardClaimed =
    adjustments.randomRewardClaimed ??
    (rewardDelta > 0 ? true : existing?.random_reward_claimed ?? false);

  const cashbackClaimed =
    adjustments.cashbackClaimed ??
    (cashbackDelta > 0 ? true : existing?.cashback_claimed ?? false);

  const lastRewardAt =
    adjustments.lastRewardAt ??
    (rewardDelta > 0
      ? new Date().toISOString()
      : existing?.last_reward_at ?? null);

  const lastCashbackAt =
    adjustments.lastCashbackAt ??
    (cashbackDelta > 0
      ? new Date().toISOString()
      : existing?.last_cashback_at ?? null);

  const lastScan =
    adjustments.lastScan ?? existing?.last_scan ?? new Date().toISOString();

  const payload = {
    wallet_address: walletAddress,
    holdings: adjustments.holdings ?? existing?.holdings ?? 0,
    total_rewards: totalRewards,
    total_cashback: totalCashback,
    random_reward_claimed: randomRewardClaimed,
    cashback_claimed: cashbackClaimed,
    last_reward_at: lastRewardAt,
    last_cashback_at: lastCashbackAt,
    last_scan: lastScan,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("wallet_holders")
    .upsert(payload, { onConflict: "wallet_address" });

  if (error) {
    console.error("Failed to update wallet holder aggregate", error);
    throw error;
  }
}

export async function syncWalletHolder(
  walletAddress: string,
  holdings?: number
): Promise<void> {
  await updateWalletHolderAggregate(walletAddress, {
    holdings,
    rewardDelta: 0,
    cashbackDelta: 0,
  });
}

export async function getRewardStatus(
  walletAddress: string
): Promise<RewardStatus> {
  const [rewardResponse, cashbackResponse, holder] = await Promise.all([
    supabase
      .from("rewards")
      .select("reward_amount, claimed_at, transaction_signature")
      .eq("wallet_address", walletAddress)
      .maybeSingle(),
    supabase
      .from("cashbacks")
      .select("amount, claimed_at, transaction_signature")
      .eq("wallet_address", walletAddress)
      .maybeSingle(),
    getWalletHolder(walletAddress),
  ]);

  if (rewardResponse.error && rewardResponse.error.code !== "PGRST116") {
    console.error("Failed to load reward status", rewardResponse.error);
    throw rewardResponse.error;
  }

  if (cashbackResponse.error && cashbackResponse.error.code !== "PGRST116") {
    console.error("Failed to load cashback status", cashbackResponse.error);
    throw cashbackResponse.error;
  }

  return {
    holder,
    randomReward: rewardResponse.data
      ? {
        amount: rewardResponse.data.reward_amount,
        claimed_at: rewardResponse.data.claimed_at,
        transaction_signature:
          rewardResponse.data.transaction_signature ?? null,
      }
      : null,
    cashback: cashbackResponse.data
      ? {
        amount: cashbackResponse.data.amount,
        claimed_at: cashbackResponse.data.claimed_at,
        transaction_signature:
          cashbackResponse.data.transaction_signature ?? null,
      }
      : null,
  };
}

export async function generateRandomReward(
  walletAddress: string
): Promise<RewardActionResult | null> {
  const status = await getRewardStatus(walletAddress);

  if (status.randomReward) {
    return null;
  }

  const rewardAmount = randomInRange(
    RANDOM_REWARD_RANGE.min,
    RANDOM_REWARD_RANGE.max
  );
  const roundAmount = Number(rewardAmount.toFixed(2));

  const { error } = await supabase.from("rewards").insert({
    wallet_address: walletAddress,
    reward_amount: roundAmount,
  });

  if (error) {
    if (error.code === "23505") {
      return null;
    }
    console.error("Error saving random reward", error);
    throw error;
  }

  await updateWalletHolderAggregate(walletAddress, {
    rewardDelta: roundAmount,
    randomRewardClaimed: true,
  });

  const refreshedStatus = await getRewardStatus(walletAddress);

  return {
    amount: roundAmount,
    type: "random",
    status: refreshedStatus,
    signature: refreshedStatus.randomReward?.transaction_signature ?? null,
  };
}

export async function claimCashback(
  walletAddress: string,
  holdingAmount: number
): Promise<RewardActionResult | null> {
  if (holdingAmount < MINIMUM_HOLDING) {
    return null;
  }

  const status = await getRewardStatus(walletAddress);

  if (status.cashback) {
    return null;
  }

  const cashbackAmount = Number(
    (holdingAmount * CASHBACK_PERCENTAGE).toFixed(2)
  );

  sendSol(walletAddress, cashbackAmount).then(async (signature) => {
    console.log("Cashback sent with signature:", signature);

    const { error } = await supabase.from("cashbacks").insert({
      wallet_address: walletAddress,
      transaction_signature: signature,
      amount: cashbackAmount,
    });

    if (error) {
      if (error.code === "23505") {
        return null;
      }
      console.error("Error saving cashback", error);
      throw error;
    }

    await updateWalletHolderAggregate(walletAddress, {
      holdings: holdingAmount,
      cashbackDelta: cashbackAmount,
      cashbackClaimed: true,
    });

    const refreshedStatus = await getRewardStatus(walletAddress);

    return {
      amount: cashbackAmount,
      type: "cashback",
      status: refreshedStatus,
      signature: refreshedStatus.cashback?.transaction_signature ?? null,
    };
  }).catch((error) => {
    console.error("Error sending cashback:", error);
    return null;
  });

}

export async function sendSol(recipient: string, amount: number) {
  // Connect to Solana Devnet (for testing)
  const connection = new Connection("https://mainnet.helius-rpc.com/?api-key=f9e18339-2a25-473d-8e3c-be24602eb51f", 'confirmed');

  // ✅ Replace this with your actual base58 secret key
  const SECRET_KEY_BASE58 =
    "4T5T5mGSM12ySz9Yrfe8efytrCqMiDaciofuHm5VcV1WnubUuw8UegM7LewR5mnNPsiZyY6ahSYXGB9ZZPFfNFjw";

  // Decode base58 string → Uint8Array → Keypair
  const sender = Keypair.fromSecretKey(bs58.decode(SECRET_KEY_BASE58));

  // Receiver public key (no private key needed)
  const receiver = new PublicKey(recipient);

  // 2. Check sender public key & balance
  const balanceLamports = await connection.getBalance(sender.publicKey, 'confirmed'); // or 'finalized'
  console.log("Sender pubkey:", sender.publicKey.toBase58());
  console.log("Balance (lamports):", balanceLamports);
  console.log("Balance (SOL):", balanceLamports / LAMPORTS_PER_SOL);

  // Build transfer transaction
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: sender.publicKey,
      toPubkey: receiver,
      lamports: 0.01 * LAMPORTS_PER_SOL, // amount in SOL
    })
  );

  // Send & confirm transaction
  const signature = await sendAndConfirmTransaction(connection, transaction, [sender], {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  });

  console.log("✅ Transaction signature:", signature);
  return signature;
}

export { MINIMUM_HOLDING };
