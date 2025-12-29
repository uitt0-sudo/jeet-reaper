import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { MINIMUM_HOLDING, RANDOM_REWARD_RANGE } from "@/config/rewards";
import { findCashbackTier } from "@/config/cashback-tiers";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

const TOKEN_MINT_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_MINT_ADDRESS ?? "";

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

export async function fetchTokenHoldings(
  walletAddress: string
): Promise<number> {
  if (!walletAddress || !TOKEN_MINT_ADDRESS) {
    return 0;
  }

  // Use server-side API route to fetch balances securely
  const response = await fetch(`/api/helius/balances?wallet=${encodeURIComponent(walletAddress)}`);
  
  if (!response.ok) {
    console.error('Failed to fetch token balances');
    throw new Error("Failed to fetch token balances");
  }

  const payload = await response.json() as {
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

function getCashbackAmount(holdingAmount: number): number {
  const tier = findCashbackTier(holdingAmount);
  if (!tier) {
    return 0;
  }

  return randomInRange(tier.reward.min, tier.reward.max);
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

  const cashbackAmount = getCashbackAmount(holdingAmount);
  
  try {
    const signature = await sendSol(walletAddress, cashbackAmount);
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
  } catch (error) {
    console.error("Error sending cashback:", error);
    return null;
  }
}

/**
 * Send SOL via secure server-side API
 * Private keys are never exposed to the client
 */
export async function sendSol(recipient: string, amount: number): Promise<string> {
  const lamports = Math.floor(amount * LAMPORTS_PER_SOL);
  
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
  console.log("✅ Transaction signature:", result.signature);
  return result.signature;
}

export { MINIMUM_HOLDING };
