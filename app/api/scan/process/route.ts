import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/integrations/supabase/server';
import { analyzePaperhands } from '@/services/paperhands';

const MAX_CONCURRENT = 5;

/**
 * Process the next job in the queue.
 * This can be called:
 * 1. After a job completes to process the next one
 * 2. By a cron job to ensure queue keeps moving
 * 3. By the queue endpoint when there's capacity
 */
export async function POST(_request: NextRequest) {
  const supabase = createServerSupabaseClient();

  // Check if we have capacity
  const { count: processingCount } = await supabase
    .from('scan_jobs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'processing');

  if ((processingCount ?? 0) >= MAX_CONCURRENT) {
    return NextResponse.json({
      message: 'At max capacity',
      processing: processingCount,
    });
  }

  // Get the next queued job (oldest first)
  const { data: nextJob, error: fetchError } = await supabase
    .from('scan_jobs')
    .select('*')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (fetchError || !nextJob) {
    return NextResponse.json({
      message: 'No jobs in queue',
    });
  }

  // Mark as processing
  await supabase
    .from('scan_jobs')
    .update({
      status: 'processing',
      started_at: new Date().toISOString(),
    })
    .eq('id', nextJob.id);

  // Run the analysis
  try {
    const result = await analyzePaperhands(
      nextJob.wallet_address,
      nextJob.days_back ?? 30
    );

    // Mark as complete
    await supabase
      .from('scan_jobs')
      .update({
        status: 'complete',
        result: JSON.parse(JSON.stringify(result)),
        completed_at: new Date().toISOString(),
      })
      .eq('id', nextJob.id);

    // Trigger processing of next job in queue
    await processNextInQueue(supabase);

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

    // Still try to process next job
    await processNextInQueue(supabase);

    return NextResponse.json({
      message: 'Job failed',
      jobId: nextJob.id,
      error: errorMessage,
    });
  }
}

async function processNextInQueue(supabase: ReturnType<typeof createServerSupabaseClient>) {
  const { count: processingCount } = await supabase
    .from('scan_jobs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'processing');

  if ((processingCount ?? 0) >= MAX_CONCURRENT) {
    return;
  }

  const { data: nextJob } = await supabase
    .from('scan_jobs')
    .select('*')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (nextJob) {
    // Mark as processing - actual processing will happen on next call
    await supabase
      .from('scan_jobs')
      .update({
        status: 'processing',
        started_at: new Date().toISOString(),
      })
      .eq('id', nextJob.id);
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

  return NextResponse.json({
    maxConcurrent: MAX_CONCURRENT,
    jobs: jobs ?? [],
  });
}
