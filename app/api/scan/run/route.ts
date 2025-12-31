import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/integrations/supabase/server';
import { analyzePaperhands } from '@/services/paperhands';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId is required' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Fetch the job first to check its current status
    const { data: job, error: fetchError } = await supabase
      .from('scan_jobs')
      .select('*')
      .eq('id', jobId)
      .maybeSingle();

    if (fetchError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // If already complete or failed, return current status
    if (job.status === 'complete') {
      return NextResponse.json({
        status: 'complete',
        result: job.result,
      });
    }

    if (job.status === 'failed') {
      return NextResponse.json({
        status: 'failed',
        error: job.error,
      });
    }

    // If already processing, return current status
    if (job.status === 'processing') {
      return NextResponse.json({
        status: 'processing',
        message: 'Job is already being processed',
      });
    }

    // HARD GUARD: Use atomic RPC to claim the job
    // This will fail if already at 5 concurrent processing jobs
    const { data: claimed, error: claimError } = await supabase
      .rpc('try_claim_job', { job_id: jobId });

    if (claimError) {
      console.error('Failed to claim job:', claimError);
      return NextResponse.json(
        { error: 'Failed to claim job' },
        { status: 500 }
      );
    }

    if (!claimed) {
      // Could not claim - either at capacity or job no longer queued
      return NextResponse.json({
        status: 'queued',
        message: 'At maximum capacity (5 concurrent scans). Job remains queued.',
      });
    }

    // Job successfully claimed - run the analysis
    try {
      const result = await analyzePaperhands(
        job.wallet_address,
        job.days_back ?? 30
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
        .eq('id', jobId);

      // ========== CACHE THE RESULT ==========
      // Upsert into wallet_analyses with 48-hour expiry
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 48);

      await supabase
        .from('wallet_analyses')
        .upsert({
          wallet_address: job.wallet_address,
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
        status: 'complete',
        result,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Mark as failed
      await supabase
        .from('scan_jobs')
        .update({
          status: 'failed',
          error: errorMessage,
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      return NextResponse.json({
        status: 'failed',
        error: errorMessage,
      });
    }
  } catch (error) {
    console.error('Run job error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
