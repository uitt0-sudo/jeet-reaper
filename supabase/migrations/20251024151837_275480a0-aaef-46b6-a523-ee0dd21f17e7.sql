-- Create token metadata cache table (permanent cache)
CREATE TABLE public.token_metadata (
  mint TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  logo TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create token price cache table (5-min TTL)
CREATE TABLE public.token_prices (
  mint TEXT PRIMARY KEY,
  price NUMERIC NOT NULL,
  market_cap NUMERIC,
  ath_price NUMERIC,
  price_change_24h NUMERIC,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add expiration column to wallet_analyses for 1-hour cache
ALTER TABLE public.wallet_analyses 
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 hour');

-- Add indexes for performance
CREATE INDEX idx_token_metadata_updated ON public.token_metadata(updated_at);
CREATE INDEX idx_token_prices_updated ON public.token_prices(updated_at);
CREATE INDEX idx_wallet_analyses_expires ON public.wallet_analyses(expires_at);
CREATE INDEX idx_wallet_analyses_address ON public.wallet_analyses(wallet_address);

-- Enable RLS on new tables
ALTER TABLE public.token_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_prices ENABLE ROW LEVEL SECURITY;

-- Allow public read access to cache tables (public data)
CREATE POLICY "Anyone can read token metadata"
  ON public.token_metadata FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can read token prices"
  ON public.token_prices FOR SELECT
  TO public
  USING (true);

-- Allow public insert/update for cache tables (edge function will populate)
CREATE POLICY "Anyone can insert token metadata"
  ON public.token_metadata FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update token metadata"
  ON public.token_metadata FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Anyone can insert token prices"
  ON public.token_prices FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update token prices"
  ON public.token_prices FOR UPDATE
  TO public
  USING (true);