-- Create auction_records table
CREATE TABLE public.auction_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    name TEXT,
    phone_number TEXT,
    auction_room TEXT,
    no TEXT,
    auc_no TEXT,
    amount NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security
ALTER TABLE public.auction_records ENABLE ROW LEVEL SECURITY;

-- Create policies for tenant isolation
CREATE POLICY "Users can view their tenant's auction records"
    ON public.auction_records FOR SELECT
    USING (tenant_id IN (
        SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can insert auction records for their tenant"
    ON public.auction_records FOR INSERT
    WITH CHECK (tenant_id IN (
        SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update their tenant's auction records"
    ON public.auction_records FOR UPDATE
    USING (tenant_id IN (
        SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can delete their tenant's auction records"
    ON public.auction_records FOR DELETE
    USING (tenant_id IN (
        SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()
    ));
