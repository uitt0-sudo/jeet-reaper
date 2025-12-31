import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/integrations/supabase/server';
import { analyzePaperhands } from '@/services/paperhands';

/**
 * Run a specific job by ID.
 * Called internally to process a job that was marked as 'processing'.
 */
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

    // Get the job
    const { data: job, error: fetchError } = await supabase
      .from('scan_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (fetchError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    if (job.status === 'complete') {
      return NextResponse.json({
        message: 'Job already complete',
        result: job.result,
      });
    }

    if (job.status === 'failed') {
      return NextResponse.json(
        { error: 'Job already failed', details: job.error },
        { status: 400 }
      );
    }

    // Mark as processing if not already
    if (job.status !== 'processing') {
      await supabase
        .from('scan_jobs')
        .update({
          status: 'processing',
          started_at: new Date().toISOString(),
        })
        .eq('id', jobId);
    }

    // Run the analysis
    try {
      const result = await analyzePaperhands(
        job.wallet_address,
        job.days_back ?? 30
      );

      // Mark as complete
      await supabase
        .from('scan_jobs')
        .update({
          status: 'complete',
          result: JSON.parse(JSON.stringify(result)),
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      return NextResponse.json({
        message: 'Job completed',
        jobId: job.id,
        result,
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
        .eq('id', jobId);

      return NextResponse.json(
        { error: 'Analysis failed', details: errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Run job error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
