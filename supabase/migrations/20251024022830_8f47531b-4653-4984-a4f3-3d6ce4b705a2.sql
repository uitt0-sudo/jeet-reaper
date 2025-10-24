-- Create wallet_analyses table to store all wallet analysis results
CREATE TABLE IF NOT EXISTS public.wallet_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  total_regret NUMERIC NOT NULL DEFAULT 0,
  total_events INTEGER NOT NULL DEFAULT 0,
  coins_traded INTEGER NOT NULL DEFAULT 0,
  win_rate NUMERIC NOT NULL DEFAULT 0,
  avg_hold_time NUMERIC NOT NULL DEFAULT 0,
  top_regretted_tokens JSONB DEFAULT '[]'::jsonb,
  analysis_date_range JSONB,
  analyzed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.wallet_analyses ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read wallet analyses (public leaderboard)
CREATE POLICY "Anyone can view wallet analyses"
  ON public.wallet_analyses
  FOR SELECT
  USING (true);

-- Create policy to allow anyone to insert wallet analyses (no auth required)
CREATE POLICY "Anyone can insert wallet analyses"
  ON public.wallet_analyses
  FOR INSERT
  WITH CHECK (true);

-- Create index on total_regret for leaderboard sorting
CREATE INDEX idx_wallet_analyses_total_regret ON public.wallet_analyses(total_regret DESC);

-- Create index on analyzed_at for recent analyses
CREATE INDEX idx_wallet_analyses_analyzed_at ON public.wallet_analyses(analyzed_at DESC);

-- Enable realtime for the wallet_analyses table
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_analyses;