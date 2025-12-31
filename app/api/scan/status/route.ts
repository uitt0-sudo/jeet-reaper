import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/integrations/supabase/server';

export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json(
      { error: 'jobId is required' },
      { status: 400 }
    );
  }

  const supabase = createServerSupabaseClient();

  const { data: job, error } = await supabase
    .from('scan_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (error || !job) {
    return NextResponse.json(
      { error: 'Job not found' },
      { status: 404 }
    );
  }

  // If queued, calculate current position
  let currentPosition = job.queue_position;
  if (job.status === 'queued') {
    const { count } = await supabase
      .from('scan_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'queued')
      .lt('created_at', job.created_at);
    
    currentPosition = (count ?? 0) + 1;
  }

  return NextResponse.json({
    jobId: job.id,
    walletAddress: job.wallet_address,
    status: job.status,
    queuePosition: job.status === 'queued' ? currentPosition : null,
    result: job.result,
    error: job.error,
    createdAt: job.created_at,
    startedAt: job.started_at,
    completedAt: job.completed_at,
  });
}
