-- 1. Fix constraints to allow 'staff' and other roles (just to be safe)
ALTER TABLE public.tenant_users DROP CONSTRAINT IF EXISTS tenant_users_role_check;
ALTER TABLE public.tenant_invites DROP CONSTRAINT IF EXISTS tenant_invites_role_check;

-- 2. Convert all existing pending invites to lowercase so they match auth.users
UPDATE public.tenant_invites SET email = LOWER(email);

-- 3. Update the RPC function to always use lowercase emails
CREATE OR REPLACE FUNCTION invite_user_by_email(target_email TEXT, target_tenant_id UUID, target_role TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  found_user_id UUID;
  caller_role TEXT;
  normalized_email TEXT;
BEGIN
  normalized_email := LOWER(target_email);

  -- 1. Check if caller has permission (must be owner or admin of the tenant)
  SELECT role INTO caller_role FROM public.tenant_users 
  WHERE tenant_id = target_tenant_id AND user_id = auth.uid();
  
  IF caller_role IS NULL OR caller_role NOT IN ('owner', 'admin') THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Not authorized to invite users to this tenant.');
  END IF;

  -- 2. Check if the target user already exists in the system
  SELECT id INTO found_user_id FROM auth.users WHERE email = normalized_email LIMIT 1;

  IF found_user_id IS NOT NULL THEN
    -- User exists! Add them directly to the tenant_users table
    INSERT INTO public.tenant_users (tenant_id, user_id, role)
    VALUES (target_tenant_id, found_user_id, target_role)
    ON CONFLICT (tenant_id, user_id) DO UPDATE SET role = EXCLUDED.role;
    
    -- Also remove any pending invites for this email
    DELETE FROM public.tenant_invites WHERE email = normalized_email AND tenant_id = target_tenant_id;
    
    RETURN jsonb_build_object('status', 'success', 'message', 'User already had an account and was added directly to the company!');
  ELSE
    -- User does not exist. Add them to the pending invites table
    INSERT INTO public.tenant_invites (tenant_id, email, role, invited_by)
    VALUES (target_tenant_id, normalized_email, target_role, auth.uid())
    ON CONFLICT (tenant_id, email) DO UPDATE SET role = EXCLUDED.role;
    
    RETURN jsonb_build_object('status', 'pending', 'message', 'User does not have an account yet. An invite has been registered. Please ask them to sign up!');
  END IF;
END;
$$;

-- 4. Update the trigger to always compare lowercase emails
CREATE OR REPLACE FUNCTION public.handle_new_user_invites()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into tenant_users for any pending invites matching the new user's email
  INSERT INTO public.tenant_users (tenant_id, user_id, role)
  SELECT tenant_id, NEW.id, role
  FROM public.tenant_invites
  WHERE LOWER(email) = LOWER(NEW.email)
  ON CONFLICT DO NOTHING;

  -- Delete the processed invites
  DELETE FROM public.tenant_invites WHERE LOWER(email) = LOWER(NEW.email);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Force-process any pending invites for users who ALREADY registered 
-- (This fixes the issue for Milton and Justin specifically)
INSERT INTO public.tenant_users (tenant_id, user_id, role)
SELECT ti.tenant_id, au.id, ti.role
FROM public.tenant_invites ti
JOIN auth.users au ON LOWER(ti.email) = LOWER(au.email)
ON CONFLICT (tenant_id, user_id) DO UPDATE SET role = EXCLUDED.role;

DELETE FROM public.tenant_invites ti
USING auth.users au
WHERE LOWER(ti.email) = LOWER(au.email);
