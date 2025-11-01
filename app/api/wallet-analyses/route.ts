import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/integrations/supabase/server";
import {
  ensureDailyLeaderboardReward,
  type LeaderboardEntry,
} from "@/lib/leaderboard-server";

const requestSchema = z.object({
  walletAddress: z.string().min(32, "Wallet address is required"),
  totalRegret: z.number(),
  totalEvents: z.number(),
  coinsTraded: z.number().optional(),
  winRate: z.number(),
  avgHoldTime: z.number(),
  topRegrettedTokens: z.any().optional(),
  analysisDateRange: z.any().optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = createServerSupabaseClient();

  const payload = {
    wallet_address: parsed.data.walletAddress,
    total_regret: parsed.data.totalRegret,
    total_events: parsed.data.totalEvents,
    coins_traded: parsed.data.coinsTraded ?? 0,
    win_rate: parsed.data.winRate,
    avg_hold_time: parsed.data.avgHoldTime,
    top_regretted_tokens: parsed.data.topRegrettedTokens ?? null,
    analysis_date_range: parsed.data.analysisDateRange ?? null,
    analyzed_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("wallet_analyses")
    .insert(payload)
    .select(
      "id, wallet_address, total_regret, total_events, coins_traded, win_rate, avg_hold_time, analyzed_at"
    )
    .single<LeaderboardEntry>();

  if (error) {
    console.error("Failed to record wallet analysis", error);
    return NextResponse.json(
      { error: "Failed to save analysis" },
      { status: 500 }
    );
  }

  try {
    await ensureDailyLeaderboardReward(supabase);
  } catch (rewardError) {
    console.error("Failed to ensure daily leaderboard reward", rewardError);
  }

  return NextResponse.json({ analysis: data });
}
