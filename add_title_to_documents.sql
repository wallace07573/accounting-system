-- Run this script in the Supabase SQL Editor

ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS title TEXT;
