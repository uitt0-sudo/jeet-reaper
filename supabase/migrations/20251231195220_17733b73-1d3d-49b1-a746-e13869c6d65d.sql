-- Create atomic job claiming function with row-level locking
CREATE OR REPLACE FUNCTION public.try_claim_job(job_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_processing INTEGER;
  job_status TEXT;
BEGIN
  -- Lock all processing jobs to prevent race conditions
  SELECT COUNT(*) INTO current_processing
  FROM public.scan_jobs
  WHERE status = 'processing'
  FOR UPDATE;
  
  -- Get current job status with lock
  SELECT status INTO job_status
  FROM public.scan_jobs
  WHERE id = job_id
  FOR UPDATE;
  
  -- If job doesn't exist or not queued, return false
  IF job_status IS NULL OR job_status != 'queued' THEN
    RETURN FALSE;
  END IF;
  
  -- HARD GUARD: If at capacity (5 processing), cannot claim
  IF current_processing >= 5 THEN
    RETURN FALSE;
  END IF;
  
  -- Atomically update to processing
  UPDATE public.scan_jobs
  SET status = 'processing',
      started_at = now()
  WHERE id = job_id AND status = 'queued';
  
  RETURN TRUE;
END;
$$;