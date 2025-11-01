import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/integrations/supabase/server";
import { ensureDailyLeaderboardReward } from "@/lib/leaderboard-server";

export async function GET() {
  const supabase = createServerSupabaseClient();

  try {
    const reward = await ensureDailyLeaderboardReward(supabase);
    return NextResponse.json({
      status: reward ? "awarded" : "skipped",
      reward,
    });
  } catch (error) {
    console.error("Daily draw failed", error);
    return NextResponse.json(
      { status: "error", error: (error as Error).message },
      { status: 500 }
    );
  }
}
