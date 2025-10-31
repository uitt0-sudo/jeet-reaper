-- Add transaction_signature column to rewards table
ALTER TABLE public.rewards ADD COLUMN transaction_signature text;

-- Add transaction_signature column to cashbacks table
ALTER TABLE public.cashbacks ADD COLUMN transaction_signature text;