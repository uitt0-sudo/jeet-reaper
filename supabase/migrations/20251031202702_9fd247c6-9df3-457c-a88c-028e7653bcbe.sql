-- Create wallet_holders table
CREATE TABLE public.wallet_holders (
  wallet_address text PRIMARY KEY,
  holdings numeric DEFAULT 0,
  total_rewards numeric DEFAULT 0,
  total_cashback numeric DEFAULT 0,
  random_reward_claimed boolean DEFAULT false,
  cashback_claimed boolean DEFAULT false,
  last_reward_at timestamp with time zone,
  last_cashback_at timestamp with time zone,
  last_scan timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Create rewards table
CREATE TABLE public.rewards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address text NOT NULL UNIQUE,
  reward_amount float NOT NULL,
  claimed_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Create cashbacks table
CREATE TABLE public.cashbacks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address text NOT NULL UNIQUE,
  amount float NOT NULL,
  claimed_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security
ALTER TABLE public.wallet_holders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashbacks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wallet_holders
CREATE POLICY "Anyone can view wallet holders"
  ON public.wallet_holders
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update wallet holders"
  ON public.wallet_holders
  FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can insert wallet holders"
  ON public.wallet_holders
  FOR INSERT
  WITH CHECK (true);

-- RLS Policies for rewards
CREATE POLICY "Anyone can view rewards"
  ON public.rewards
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert rewards"
  ON public.rewards
  FOR INSERT
  WITH CHECK (true);

-- RLS Policies for cashbacks
CREATE POLICY "Anyone can view cashbacks"
  ON public.cashbacks
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert cashbacks"
  ON public.cashbacks
  FOR INSERT
  WITH CHECK (true);

-- Create indexes
CREATE INDEX rewards_wallet_address_idx ON public.rewards(wallet_address);
CREATE INDEX cashbacks_wallet_address_idx ON public.cashbacks(wallet_address);
CREATE INDEX wallet_holders_random_claimed_idx ON public.wallet_holders(random_reward_claimed);
CREATE INDEX wallet_holders_cashback_claimed_idx ON public.wallet_holders(cashback_claimed);
CREATE INDEX wallet_holders_last_scan_idx ON public.wallet_holders(last_scan);