-- Create heatup_wishlists table
CREATE TABLE IF NOT EXISTS public.heatup_wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    contact TEXT NOT NULL,
    items_requested TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for wishlists
ALTER TABLE public.heatup_wishlists ENABLE ROW LEVEL SECURITY;

-- Do not keep open INSERT policies. Public writes go through
-- /api/public/* with STOREFRONT_API_KEY (see database/migrations/).
DROP POLICY IF EXISTS "Allow public insert on heatup_wishlists" ON public.heatup_wishlists;

-- Allow tenant users to select their own data
CREATE POLICY "Allow tenant select on heatup_wishlists"
    ON public.heatup_wishlists FOR SELECT
    USING (user_belongs_to_tenant(tenant_id));

-- Allow tenant users to update their own data
CREATE POLICY "Allow tenant update on heatup_wishlists"
    ON public.heatup_wishlists FOR UPDATE
    USING (user_belongs_to_tenant(tenant_id));


-- Create heatup_preorders table
CREATE TABLE IF NOT EXISTS public.heatup_preorders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    contact TEXT NOT NULL,
    product_details TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for preorders
ALTER TABLE public.heatup_preorders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert on heatup_preorders" ON public.heatup_preorders;

CREATE POLICY "Allow tenant select on heatup_preorders"
    ON public.heatup_preorders FOR SELECT
    USING (user_belongs_to_tenant(tenant_id));

CREATE POLICY "Allow tenant update on heatup_preorders"
    ON public.heatup_preorders FOR UPDATE
    USING (user_belongs_to_tenant(tenant_id));
