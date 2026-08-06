-- Create heatup_wishlists table
CREATE TABLE IF NOT EXISTS public.heatup_wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    contact TEXT NOT NULL,
    items_requested TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for wishlists
ALTER TABLE public.heatup_wishlists ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (so the API can insert without authentication if using anon key, though API might use service role)
CREATE POLICY "Allow public insert on heatup_wishlists"
    ON public.heatup_wishlists FOR INSERT
    WITH CHECK (true);

-- Allow tenant users to select their own data
CREATE POLICY "Allow tenant select on heatup_wishlists"
    ON public.heatup_wishlists FOR SELECT
    USING (tenant_id = current_setting('app.current_tenant_id', true));

-- Allow tenant users to update their own data
CREATE POLICY "Allow tenant update on heatup_wishlists"
    ON public.heatup_wishlists FOR UPDATE
    USING (tenant_id = current_setting('app.current_tenant_id', true));


-- Create heatup_preorders table
CREATE TABLE IF NOT EXISTS public.heatup_preorders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    contact TEXT NOT NULL,
    product_details TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for preorders
ALTER TABLE public.heatup_preorders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert on heatup_preorders"
    ON public.heatup_preorders FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow tenant select on heatup_preorders"
    ON public.heatup_preorders FOR SELECT
    USING (tenant_id = current_setting('app.current_tenant_id', true));

CREATE POLICY "Allow tenant update on heatup_preorders"
    ON public.heatup_preorders FOR UPDATE
    USING (tenant_id = current_setting('app.current_tenant_id', true));
