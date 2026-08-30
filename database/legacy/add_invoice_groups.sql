CREATE TABLE public.invoice_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#f8fafc',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.invoice_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for invoice groups"
    ON public.invoice_groups FOR ALL
    USING (user_belongs_to_tenant(tenant_id));

ALTER TABLE public.documents ADD COLUMN group_id UUID REFERENCES public.invoice_groups(id) ON DELETE SET NULL;
