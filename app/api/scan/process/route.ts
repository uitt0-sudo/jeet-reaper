import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/integrations/supabase/server';
import { analyzePaperhands } from '@/services/paperhands';

const MAX_CONCURRENT = 5;

/**
 * Process the next job in the queue.
 * Uses atomic try_claim_job to ensure HARD concurrency limit of 5.
 */
export async function POST(_request: NextRequest) {
  const supabase = createServerSupabaseClient();

  // Get the next queued job (oldest first)
  const { data: nextJob, error: fetchError } = await supabase
    .from('scan_jobs')
    .select('*')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    console.error('Failed to fetch next job:', fetchError);
    return NextResponse.json({
      message: 'Failed to fetch queue',
      error: fetchError.message,
    }, { status: 500 });
  }

  if (!nextJob) {
    return NextResponse.json({
      message: 'No jobs in queue',
    });
  }

  // HARD GUARD: Use atomic RPC to claim the job
  // This will fail if already at 5 concurrent processing jobs
  const { data: claimed, error: claimError } = await supabase
    .rpc('try_claim_job', { job_id: nextJob.id });

  if (claimError) {
    console.error('Failed to claim job:', claimError);
    return NextResponse.json({
      message: 'Failed to claim job',
      error: claimError.message,
    }, { status: 500 });
  }

  if (!claimed) {
    return NextResponse.json({
      message: 'At max capacity (5 concurrent). Job remains queued.',
      jobId: nextJob.id,
    });
  }

  // Job claimed successfully - run the analysis
  try {
    const result = await analyzePaperhands(
      nextJob.wallet_address,
      nextJob.days_back ?? 30
    );

    const resultJson = JSON.parse(JSON.stringify(result));

    // Mark as complete
    await supabase
      .from('scan_jobs')
      .update({
        status: 'complete',
        result: resultJson,
        completed_at: new Date().toISOString(),
      })
      .eq('id', nextJob.id);

    // ========== CACHE THE RESULT ==========
    // Upsert into wallet_analyses with 48-hour expiry
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    await supabase
      .from('wallet_analyses')
      .upsert({
        wallet_address: nextJob.wallet_address,
        total_regret: result.totalRegret ?? 0,
        total_events: result.totalEvents ?? 0,
        coins_traded: result.coinsTraded ?? 0,
        win_rate: result.winRate ?? 0,
        avg_hold_time: result.avgHoldTime ?? 0,
        top_regretted_tokens: result.topRegrettedTokens ?? [],
        analysis_date_range: result.analysisDateRange ?? null,
        analyzed_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      }, {
        onConflict: 'wallet_address',
      });

    return NextResponse.json({
      message: 'Job completed',
      jobId: nextJob.id,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    await supabase
      .from('scan_jobs')
      .update({
        status: 'failed',
        error: errorMessage,
        completed_at: new Date().toISOString(),
      })
      .eq('id', nextJob.id);

    return NextResponse.json({
      message: 'Job failed',
      jobId: nextJob.id,
      error: errorMessage,
    });
  }
}

// GET endpoint to check queue status
export async function GET() {
  const supabase = createServerSupabaseClient();

  const { data: jobs } = await supabase
    .from('scan_jobs')
    .select('id, wallet_address, status, created_at, started_at')
    .in('status', ['queued', 'processing'])
    .order('created_at', { ascending: true });

  const processing = jobs?.filter(j => j.status === 'processing').length ?? 0;

  return NextResponse.json({
    maxConcurrent: MAX_CONCURRENT,
    currentlyProcessing: processing,
    jobs: jobs ?? [],
  });
}
