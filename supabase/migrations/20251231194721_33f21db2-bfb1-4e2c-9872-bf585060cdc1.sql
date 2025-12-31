-- Create scan_jobs table for queue management
CREATE TABLE public.scan_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  days_back INTEGER DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'complete', 'failed')),
  result JSONB,
  error TEXT,
  queue_position INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Index for efficient queue queries
CREATE INDEX idx_scan_jobs_status ON public.scan_jobs(status);
CREATE INDEX idx_scan_jobs_created_at ON public.scan_jobs(created_at);
CREATE INDEX idx_scan_jobs_wallet ON public.scan_jobs(wallet_address);

-- Enable RLS
ALTER TABLE public.scan_jobs ENABLE ROW LEVEL SECURITY;

-- Public read/insert policy (anyone can submit and check their job)
CREATE POLICY "Anyone can view scan jobs"
  ON public.scan_jobs FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert scan jobs"
  ON public.scan_jobs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update scan jobs"
  ON public.scan_jobs FOR UPDATE
  USING (true);