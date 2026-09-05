-- Add work_order_no column to documents table
-- Run this in the Supabase SQL Editor

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS work_order_no TEXT;

COMMENT ON COLUMN public.documents.work_order_no IS 'Optional Work Order Number associated with the document/invoice';
