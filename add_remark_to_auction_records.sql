-- Add remark column to auction_records table
ALTER TABLE public.auction_records ADD COLUMN IF NOT EXISTS remark TEXT;
