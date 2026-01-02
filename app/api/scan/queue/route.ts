import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/integrations/supabase/server';

const MAX_CONCURRENT = 5;
const RATE_LIMIT_MINUTES = 15; // Soft rate limit: 1 scan per wallet per 15 minutes


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, daysBack = 30 } = body;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return NextResponse.json(
        { error: 'walletAddress is required' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // ========== CACHE CHECK ==========
    // Check for valid cached result before queueing
    const { data: cached } = await supabase
      .from('wallet_analyses')
      .select('*')
      .eq('wallet_address', walletAddress)
      .gt('expires_at', new Date().toISOString())
      .order('analyzed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cached) {
      // Return cached result immediately - skip queue entirely
      return NextResponse.json({
        jobId: null,
        status: 'cached',
        cached: true,
        cachedUntil: cached.expires_at,
        result: {
          totalRegret: cached.total_regret,
          totalEvents: cached.total_events,
          coinsTraded: cached.coins_traded,
          winRate: cached.win_rate,
          avgHoldTime: cached.avg_hold_time,
          topRegrettedTokens: cached.top_regretted_tokens,
          analysisDateRange: cached.analysis_date_range,
          analyzedAt: cached.analyzed_at,
        },
      });
    }

    // ========== DUPLICATE WALLET SCAN LOCK ==========
    // Check if wallet already has a queued or processing job
    const { data: existingJob } = await supabase
      .from('scan_jobs')
      .select('id, status, created_at')
      .eq('wallet_address', walletAddress)
      .in('status', ['queued', 'processing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingJob) {
      // Get queue position for existing job
      let queuePosition = 0;
      if (existingJob.status === 'queued') {
        const { count } = await supabase
          .from('scan_jobs')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'queued')
          .lt('created_at', existingJob.created_at);
        
        queuePosition = (count ?? 0) + 1;
      }

      return NextResponse.json({
        jobId: existingJob.id,
        status: existingJob.status,
        queuePosition: existingJob.status === 'queued' ? queuePosition : 0,
        alreadyProcessing: true,
        message: 'This wallet is already being processed.',
      });
    }

    // ========== SOFT RATE LIMITING ==========
    // Check if wallet was scanned recently (within RATE_LIMIT_MINUTES)
    const rateLimitCutoff = new Date(Date.now() - RATE_LIMIT_MINUTES * 60 * 1000).toISOString();
    const { data: recentScan } = await supabase
      .from('scan_jobs')
      .select('id, completed_at')
      .eq('wallet_address', walletAddress)
      .eq('status', 'completed')
      .gt('completed_at', rateLimitCutoff)
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentScan) {
      const completedAt = new Date(recentScan.completed_at!);
      const waitUntil = new Date(completedAt.getTime() + RATE_LIMIT_MINUTES * 60 * 1000);
      const minutesRemaining = Math.ceil((waitUntil.getTime() - Date.now()) / 60000);

      return NextResponse.json({
        jobId: null,
        status: 'rate_limited',
        rateLimited: true,
        waitMinutes: minutesRemaining,
        message: `This wallet was recently scanned. Please wait ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''} before scanning again.`,
      });
    }

    // ========== NO CACHE, NO DUPLICATE, NO RATE LIMIT - PROCEED WITH QUEUE ==========
    // Insert as queued
    const { data: job, error } = await supabase
      .from('scan_jobs')
      .insert({
        wallet_address: walletAddress,
        days_back: daysBack,
        status: 'queued',
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create scan job:', error);
      return NextResponse.json(
        { error: 'Failed to create scan job' },
        { status: 500 }
      );
    }

    // Attempt to atomically claim the job (will fail if at capacity)
    const { data: claimed, error: claimError } = await supabase
      .rpc('try_claim_job', { job_id: job.id });

    if (claimError) {
      console.error('Failed to claim job:', claimError);
    }

    // Get queue position if not claimed
    let queuePosition = 0;
    if (!claimed) {
      const { count } = await supabase
        .from('scan_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'queued')
        .lt('created_at', job.created_at);
      
      queuePosition = (count ?? 0) + 1;
    }

    return NextResponse.json({
      jobId: job.id,
      status: claimed ? 'processing' : 'queued',
      queuePosition: claimed ? 0 : queuePosition,
      message: claimed 
        ? 'Scan started immediately' 
        : `Queued at position ${queuePosition}`,
    });
  } catch (error) {
    console.error('Queue error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const supabase = createServerSupabaseClient();

  const { count: processing } = await supabase
    .from('scan_jobs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'processing');

  const { count: queued } = await supabase
    .from('scan_jobs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'queued');

  return NextResponse.json({
    maxConcurrent: MAX_CONCURRENT,
    currentlyProcessing: processing ?? 0,
    queuedJobs: queued ?? 0,
    availableSlots: MAX_CONCURRENT - (processing ?? 0),
  });
}
