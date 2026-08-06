-- Run this script in the Supabase SQL Editor

CREATE TABLE public.payment_received (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    received_from TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    remark TEXT,
    is_invoice BOOLEAN DEFAULT false,
    invoice_no TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_received ENABLE ROW LEVEL SECURITY;

-- Create policy for tenant access
CREATE POLICY "Users can access their tenant payments" ON public.payment_received
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()
        )
    );
