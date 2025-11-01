import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/integrations/supabase/server";
import {
  getLatestDailyLeaderboardReward,
  type LeaderboardEntry,
} from "@/lib/leaderboard-server";

export async function GET() {
  const supabase = createServerSupabaseClient();

  const { data: entries, error } = await supabase
    .from("wallet_analyses")
    .select(
      "id, wallet_address, total_regret, total_events, coins_traded, win_rate, avg_hold_time, analyzed_at"
    )
    .order("total_regret", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Failed to load leaderboard", error);
    return NextResponse.json(
      { error: "Failed to load leaderboard" },
      { status: 500 }
    );
  }

  let dailyReward = null;
  try {
    dailyReward = await getLatestDailyLeaderboardReward(supabase);
  } catch (rewardError) {
    console.error("Failed to load daily leaderboard reward", rewardError);
  }

  return NextResponse.json({
    entries: (entries ?? []) as LeaderboardEntry[],
    dailyReward,
  });
}
