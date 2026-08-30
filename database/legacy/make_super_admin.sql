-- 1. Find the name of the check constraint for the 'role' column on 'tenant_users' table
-- Since the constraint was created inline, it usually defaults to 'tenant_users_role_check'
ALTER TABLE public.tenant_users DROP CONSTRAINT IF EXISTS tenant_users_role_check;

-- 2. Add a new check constraint that includes 'super_admin'
ALTER TABLE public.tenant_users ADD CONSTRAINT tenant_users_role_check 
  CHECK (role IN ('owner', 'super_admin', 'admin', 'member'));

-- 3. Update the role of wallace@anyismart.com to 'super_admin' for the Heat Up Collection tenant
-- We first get the user_id and tenant_id
UPDATE public.tenant_users
SET role = 'super_admin'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'wallace@anyismart.com' LIMIT 1)
  AND tenant_id = (SELECT id FROM public.tenants WHERE name ILIKE 'Heat Up Collection' LIMIT 1);
