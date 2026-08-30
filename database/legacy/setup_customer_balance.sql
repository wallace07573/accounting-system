-- Run this script in the Supabase SQL Editor

-- 1. Add balance column to customers table
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS balance NUMERIC(10, 2) DEFAULT 0;

-- 2. Create customer_transactions table
CREATE TABLE IF NOT EXISTS public.customer_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    remark TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customer_transactions ENABLE ROW LEVEL SECURITY;

-- Create policy for tenant access
CREATE POLICY "Users can access their tenant customer transactions" ON public.customer_transactions
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()
        )
    );
