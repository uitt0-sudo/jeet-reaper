import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/integrations/supabase/server';

const MAX_CONCURRENT = 5;

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

    // Count currently processing jobs
    const { count: processingCount } = await supabase
      .from('scan_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'processing');

    // Count queued jobs for position
    const { count: queuedCount } = await supabase
      .from('scan_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'queued');

    const canStartImmediately = (processingCount ?? 0) < MAX_CONCURRENT;
    const queuePosition = canStartImmediately ? 0 : (queuedCount ?? 0) + 1;

    // Insert the job
    const { data: job, error } = await supabase
      .from('scan_jobs')
      .insert({
        wallet_address: walletAddress,
        days_back: daysBack,
        status: canStartImmediately ? 'processing' : 'queued',
        queue_position: queuePosition,
        started_at: canStartImmediately ? new Date().toISOString() : null,
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

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      queuePosition: job.queue_position,
      message: canStartImmediately 
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
