-- Run this script in the Supabase SQL Editor

ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS is_corporate BOOLEAN DEFAULT false;
