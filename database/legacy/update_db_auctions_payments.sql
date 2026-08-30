-- 1. Add columns to payment_received table
ALTER TABLE public.payment_received
ADD COLUMN IF NOT EXISTS is_auction BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS auction_no TEXT;

-- 2. Add columns to auction_records table
ALTER TABLE public.auction_records
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Draft',
ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(10, 2) DEFAULT 0;
