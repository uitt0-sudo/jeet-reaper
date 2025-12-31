-- First, delete duplicate wallet_addresses keeping only the most recent one
DELETE FROM public.wallet_analyses wa1
WHERE EXISTS (
  SELECT 1 FROM public.wallet_analyses wa2
  WHERE wa1.wallet_address = wa2.wallet_address
  AND wa1.analyzed_at < wa2.analyzed_at
);

-- Now add unique constraint on wallet_address so upsert works correctly
ALTER TABLE public.wallet_analyses 
ADD CONSTRAINT wallet_analyses_wallet_address_unique UNIQUE (wallet_address);

-- Update default expires_at to 48 hours
ALTER TABLE public.wallet_analyses 
ALTER COLUMN expires_at SET DEFAULT (now() + interval '48 hours');