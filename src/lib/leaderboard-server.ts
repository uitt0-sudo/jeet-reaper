import type { Database } from "@/integrations/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";

import { sendSol } from "@/lib/solana-payments";

type RewardsRow = Database["public"]["Tables"]["rewards"]["Row"];
type WalletAnalysisRow = Database["public"]["Tables"]["wallet_analyses"]["Row"];

const DAILY_REWARD_TAG_PREFIX = "DAILY_LEADERBOARD";
const DAILY_REWARD_SIGNATURE_SEPARATOR = "|";
const DAILY_REWARD_SOL_AMOUNT = (() => {
  const raw =
    process.env.DAILY_REWARD_SOL_AMOUNT ??
    process.env.NEXT_PUBLIC_DAILY_REWARD_SOL_AMOUNT ??
    "";
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0.002;
})();

const formatDailyRewardTag = (date: Date) => {
  const iso = date.toISOString();
  return `${DAILY_REWARD_TAG_PREFIX}:${iso.slice(0, 10)}`;
};

export type DailyLeaderboardReward = Pick<
  RewardsRow,
  "id" | "wallet_address" | "reward_amount" | "created_at"
> & { tag: string; signature: string | null };

const encodeDailyRewardSignature = (tag: string, signature: string) =>
  `${tag}${DAILY_REWARD_SIGNATURE_SEPARATOR}${signature}`;

const decodeDailyRewardSignature = (
  value: string | null | undefined,
  fallbackTag: string
): { tag: string; signature: string | null } => {
  if (!value) {
    return { tag: fallbackTag, signature: null };
  }

  const [tag, signature] = value.split(DAILY_REWARD_SIGNATURE_SEPARATOR, 2);
  if (signature === undefined) {
    return { tag: value, signature: null };
  }

  return {
    tag: tag || fallbackTag,
    signature: signature || null,
  };
};

const mapDailyRewardRow = (
  row: Pick<
    RewardsRow,
    "id" | "wallet_address" | "reward_amount" | "created_at" | "transaction_signature"
  >,
  fallbackTag: string
): DailyLeaderboardReward => {
  const { tag, signature } = decodeDailyRewardSignature(
    row.transaction_signature,
    fallbackTag
  );

  return {
    id: row.id,
    wallet_address: row.wallet_address,
    reward_amount: row.reward_amount,
    created_at: row.created_at,
    tag,
    signature,
  };
};

async function findDailyRewardByTag(
  supabase: SupabaseClient<Database>,
  tag: string
): Promise<DailyLeaderboardReward | null> {
  const { data, error } = await supabase
    .from("rewards")
    .select(
      "id, wallet_address, reward_amount, created_at, transaction_signature"
    )
    .like("transaction_signature", `${tag}%`)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapDailyRewardRow(data, tag);
}

export async function ensureDailyLeaderboardReward(
  supabase: SupabaseClient<Database>
): Promise<DailyLeaderboardReward | null> {
  const today = new Date();
  const tag = formatDailyRewardTag(today);
  const rewardAmount = DAILY_REWARD_SOL_AMOUNT;

  console.log("Ensuring daily leaderboard reward for tag:", tag);

  const existing = await findDailyRewardByTag(supabase, tag);
  if (existing) {
    console.log("Daily leaderboard reward already exists for today:", existing);
    return existing;
  }

  const { data: topWallets, error: topError } = await supabase
    .from("wallet_analyses")
    .select("wallet_address, total_regret")
    .order("total_regret", { ascending: false })
    .limit(20);

  if (topError) {
    throw topError;
  }

  if (!topWallets || topWallets.length === 0) {
    return null;
  }

  const pool = topWallets.filter((entry) => entry.wallet_address);

  if (pool.length === 0) {
    console.log("No eligible wallets for daily leaderboard reward");
    return null;
  }

  while (pool.length > 0) {
    const randomIndex = Math.floor(Math.random() * pool.length);
    const [candidate] = pool.splice(randomIndex, 1);

    if (!candidate?.wallet_address) {
      continue;
    }

    try {

      console.log("Attempting to send daily reward to:", candidate.wallet_address);
      const { signature } = await sendSol(
        candidate.wallet_address,
        rewardAmount
      );
      const encodedSignature = encodeDailyRewardSignature(tag, signature);

      const { data: inserted, error: insertError } = await supabase
        .from("rewards")
        .insert({
          wallet_address: candidate.wallet_address,
          reward_amount: rewardAmount,
          transaction_signature: encodedSignature,
        })
        .select(
          "id, wallet_address, reward_amount, created_at, transaction_signature"
        )
        .single();

        console.log("Inserted reward record:", inserted, insertError);

      if (insertError || !inserted) {
        throw insertError ?? new Error("Failed to insert reward record");
      }

      return mapDailyRewardRow(inserted, tag);
    } catch (error) {
      throw error;
    }
  }

  return null;
}

export async function getLatestDailyLeaderboardReward(
  supabase: SupabaseClient<Database>
): Promise<DailyLeaderboardReward | null> {
  const { data, error } = await supabase
    .from("rewards")
    .select(
      "id, wallet_address, reward_amount, created_at, transaction_signature"
    )
    .like("transaction_signature", `${DAILY_REWARD_TAG_PREFIX}:%`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapDailyRewardRow(data, "");
}

export type LeaderboardEntry = Pick<
  WalletAnalysisRow,
  | "id"
  | "wallet_address"
  | "total_regret"
  | "total_events"
  | "coins_traded"
  | "win_rate"
  | "avg_hold_time"
  | "analyzed_at"
> & {
  top_regretted_tokens?: WalletAnalysisRow["top_regretted_tokens"];
  analysis_date_range?: WalletAnalysisRow["analysis_date_range"];
};
