-- Fix try_claim_job: PostgreSQL doesn't allow FOR UPDATE with aggregate functions
-- Solution: Lock rows first with PERFORM, then COUNT separately

CREATE OR REPLACE FUNCTION public.try_claim_job(job_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_processing INTEGER;
  job_status TEXT;
BEGIN
  -- Step 1: Lock all processing rows (no aggregate here)
  PERFORM 1 FROM public.scan_jobs
  WHERE status = 'processing'
  FOR UPDATE;
  
  -- Step 2: Now count them (safe after locking)
  SELECT COUNT(*) INTO current_processing
  FROM public.scan_jobs
  WHERE status = 'processing';
  
  -- Step 3: Lock the specific job row
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