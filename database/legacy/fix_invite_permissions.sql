-- 1. Update check constraint for tenant_users to include 'staff'
ALTER TABLE public.tenant_users DROP CONSTRAINT IF EXISTS tenant_users_role_check;
ALTER TABLE public.tenant_users ADD CONSTRAINT tenant_users_role_check 
  CHECK (role IN ('owner', 'super_admin', 'admin', 'member', 'staff'));

-- 2. Update check constraint for tenant_invites to include 'staff'
ALTER TABLE public.tenant_invites DROP CONSTRAINT IF EXISTS tenant_invites_role_check;
ALTER TABLE public.tenant_invites ADD CONSTRAINT tenant_invites_role_check 
  CHECK (role IN ('admin', 'member', 'staff'));

-- 3. Update the RPC function to allow 'super_admin' to invite users
CREATE OR REPLACE FUNCTION invite_user_by_email(target_email TEXT, target_tenant_id UUID, target_role TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  found_user_id UUID;
  caller_role TEXT;
BEGIN
  -- 1. Check if caller has permission (must be owner, admin, or super_admin of the tenant)
  SELECT role INTO caller_role FROM public.tenant_users 
  WHERE tenant_id = target_tenant_id AND user_id = auth.uid();
  
  IF caller_role IS NULL OR caller_role NOT IN ('owner', 'admin', 'super_admin') THEN
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
