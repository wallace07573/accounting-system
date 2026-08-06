-- Supabase Schema for Multi-Tenant Document Generator (Workspace Architecture)
-- Run this in your Supabase SQL Editor

-- 0. Clean up existing tables (WARNING: Drops all existing data)
DROP TABLE IF EXISTS public.document_items CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.tenant_invites CASCADE;
DROP TABLE IF EXISTS public.tenant_users CASCADE;
DROP TABLE IF EXISTS public.tenants CASCADE;

-- 1. Create Tables
CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    logo_url TEXT,
    brand_color TEXT DEFAULT '#000000',
    address TEXT,
    phone TEXT,
    email TEXT,
    bank_name TEXT,
    bank_account_number TEXT,
    bank_account_name TEXT,
    ssm_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Junction table for User <-> Tenant relationship
CREATE TABLE public.tenant_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, user_id)
);

CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    company_name TEXT,
    address TEXT,
    attention TEXT,
    contact_number TEXT,
    is_verified BOOLEAN DEFAULT false,
    bank_name TEXT,
    bank_account_name TEXT,
    bank_account_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    uom TEXT,
    default_price NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.invoice_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#f8fafc',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    group_id UUID REFERENCES public.invoice_groups(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('Invoice', 'Quotation', 'Delivery Order')),
    doc_no TEXT NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE,
    terms TEXT,
    notes TEXT,
    status TEXT DEFAULT 'Draft',
    amount_paid NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.document_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
    description TEXT NOT NULL,
    qty NUMERIC(10, 2) NOT NULL DEFAULT 1,
    uom TEXT,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_items ENABLE ROW LEVEL SECURITY;

-- 3. Helper Functions for RLS
CREATE OR REPLACE FUNCTION user_belongs_to_tenant(target_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_users 
    WHERE tenant_id = target_tenant_id 
    AND user_id = auth.uid()
  );
$$;

-- 4. Create RLS Policies

-- tenant_users: Users can see their own rows, OR members of tenants they belong to
CREATE POLICY "Users can view members of their tenants"
    ON public.tenant_users FOR SELECT
    USING (
      user_id = auth.uid() OR
      user_belongs_to_tenant(tenant_id)
    );

-- Note: We allow insertion into tenant_users safely from the backend. 
-- But for a user creating their first tenant, they need to insert a tenant, 
-- and then insert themselves into tenant_users. We will use a database function (RPC) for safe creation, 
-- or we can allow users to insert themselves if they are creating a new tenant.
-- For simplicity, let's allow insert if user_id is themselves (they can only grant themselves access if they created the tenant? 
-- Actually, it's safer to allow authenticated users to insert a tenant and then themselves into tenant_users.
CREATE POLICY "Users can insert their own tenant membership"
    ON public.tenant_users FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- tenants: Users can view and update tenants they belong to
CREATE POLICY "Users can view their tenants"
    ON public.tenants FOR SELECT
    USING (user_belongs_to_tenant(id));

CREATE POLICY "Users can insert tenants"
    ON public.tenants FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their tenants"
    ON public.tenants FOR UPDATE
    USING (user_belongs_to_tenant(id));

-- RPC Function: Safely create a new tenant and assign the creator as owner
CREATE OR REPLACE FUNCTION public.create_tenant_with_owner(
  new_name text,
  new_address text,
  new_phone text,
  new_email text,
  new_bank_name text,
  new_bank_account_number text,
  new_bank_account_name text,
  new_logo_url text,
  new_ssm_number text
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_tenant_id UUID;
BEGIN
  -- Insert the new tenant
  INSERT INTO public.tenants (name, address, phone, email, bank_name, bank_account_number, bank_account_name, logo_url, ssm_number)
  VALUES (new_name, new_address, new_phone, new_email, new_bank_name, new_bank_account_number, new_bank_account_name, new_logo_url, new_ssm_number)
  RETURNING id INTO new_tenant_id;

  -- Add the current user as the owner
  INSERT INTO public.tenant_users (tenant_id, user_id, role)
  VALUES (new_tenant_id, auth.uid(), 'owner');

  RETURN new_tenant_id;
END;
$$;

-- Customers
CREATE POLICY "Tenant isolation for customers"
    ON public.customers FOR ALL
    USING (user_belongs_to_tenant(tenant_id));

-- Products
CREATE POLICY "Tenant isolation for products"
    ON public.products FOR ALL
    USING (user_belongs_to_tenant(tenant_id));

-- Invoice Groups
CREATE POLICY "Tenant isolation for invoice groups"
    ON public.invoice_groups FOR ALL
    USING (user_belongs_to_tenant(tenant_id));

-- Documents
CREATE POLICY "Tenant isolation for documents"
    ON public.documents FOR ALL
    USING (user_belongs_to_tenant(tenant_id));

-- Document Items
CREATE POLICY "Tenant isolation for document items"
    ON public.document_items FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.documents
            WHERE documents.id = document_items.document_id
            AND user_belongs_to_tenant(documents.tenant_id)
        )
    );

-- 5. Invites System
CREATE TABLE public.tenant_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
    invited_by UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, email)
);

ALTER TABLE public.tenant_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage invites for their tenants"
    ON public.tenant_invites FOR ALL
    USING (user_belongs_to_tenant(tenant_id));

-- Trigger: When a new user registers, check if they have pending invites
CREATE OR REPLACE FUNCTION public.handle_new_user_invites()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into tenant_users for any pending invites matching the new user's email
  INSERT INTO public.tenant_users (tenant_id, user_id, role)
  SELECT tenant_id, NEW.id, role
  FROM public.tenant_invites
  WHERE email = NEW.email
  ON CONFLICT DO NOTHING;

  -- Delete the processed invites
  DELETE FROM public.tenant_invites WHERE email = NEW.email;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_invites();

-- RPC Function: Invite a user (handles both existing and new users)
CREATE OR REPLACE FUNCTION invite_user_by_email(target_email TEXT, target_tenant_id UUID, target_role TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  found_user_id UUID;
  caller_role TEXT;
BEGIN
  -- 1. Check if caller has permission (must be owner or admin of the tenant)
  SELECT role INTO caller_role FROM public.tenant_users 
  WHERE tenant_id = target_tenant_id AND user_id = auth.uid();
  
  IF caller_role IS NULL OR caller_role NOT IN ('owner', 'admin') THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Not authorized to invite users to this tenant.');
  END IF;

  -- 2. Check if the target user already exists in the system
  SELECT id INTO found_user_id FROM auth.users WHERE email = target_email LIMIT 1;

  IF found_user_id IS NOT NULL THEN
    -- User exists! Add them directly to the tenant_users table
    INSERT INTO public.tenant_users (tenant_id, user_id, role)
    VALUES (target_tenant_id, found_user_id, target_role)
    ON CONFLICT (tenant_id, user_id) DO UPDATE SET role = EXCLUDED.role;
    
    RETURN jsonb_build_object('status', 'success', 'message', 'User already had an account and was added directly to the company!');
  ELSE
    -- User does not exist. Add them to the pending invites table
    INSERT INTO public.tenant_invites (tenant_id, email, role, invited_by)
    VALUES (target_tenant_id, target_email, target_role, auth.uid())
    ON CONFLICT (tenant_id, email) DO UPDATE SET role = EXCLUDED.role;
    
    RETURN jsonb_build_object('status', 'pending', 'message', 'User does not have an account yet. An invite has been registered. Please ask them to sign up!');
  END IF;
END;
$$;

-- 6. Storage for Logos
-- Note: You need to manually create a bucket named 'logos' in the Supabase Dashboard, or use this SQL:
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true) ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "Logos are publicly accessible" ON storage.objects;
CREATE POLICY "Logos are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'logos');

DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;
CREATE POLICY "Authenticated users can upload logos"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');

-- RPC Function: Get members of a tenant including their emails securely
CREATE OR REPLACE FUNCTION get_tenant_members(p_tenant_id UUID)
RETURNS TABLE (
    id UUID,
    tenant_id UUID,
    user_id UUID,
    role TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    email VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only allow if the caller is a member of the tenant
    IF NOT EXISTS (
        SELECT 1 FROM public.tenant_users 
        WHERE public.tenant_users.tenant_id = p_tenant_id 
        AND public.tenant_users.user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    RETURN QUERY
    SELECT 
        tu.id,
        tu.tenant_id,
        tu.user_id,
        tu.role,
        tu.created_at,
        au.email::VARCHAR
    FROM public.tenant_users tu
    JOIN auth.users au ON tu.user_id = au.id
    WHERE tu.tenant_id = p_tenant_id
    ORDER BY tu.created_at ASC;
END;
$$;
