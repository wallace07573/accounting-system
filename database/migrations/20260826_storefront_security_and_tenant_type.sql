-- Storefront security + Heat Up workspace type
-- Run this in the Supabase SQL Editor (once).

-- 1. First-class tenant type (do not infer Heat Up from company name)
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS tenant_type TEXT NOT NULL DEFAULT 'standard';

ALTER TABLE public.tenants
  DROP CONSTRAINT IF EXISTS tenants_tenant_type_check;

ALTER TABLE public.tenants
  ADD CONSTRAINT tenants_tenant_type_check
  CHECK (tenant_type IN ('standard', 'heatup'));

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS enable_heat_up_po BOOLEAN DEFAULT false;

UPDATE public.tenants
SET
  tenant_type = 'heatup',
  enable_heat_up_po = true
WHERE lower(name) LIKE '%heat up%'
   OR enable_heat_up_po = true;

-- 2. Public storefront must not insert via anon key / open RLS
DROP POLICY IF EXISTS "Allow public insert on heatup_wishlists" ON public.heatup_wishlists;
DROP POLICY IF EXISTS "Allow public insert on heatup_preorders" ON public.heatup_preorders;

-- Tenant staff still read/update their own rows (policies from add_heatup_tables.sql).
-- Inserts go through the Next.js public API using the service role after a storefront API key check.
