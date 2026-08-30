-- RPC Function: Safely delete a tenant
-- Only the owner of the tenant or a super admin can delete a tenant.
CREATE OR REPLACE FUNCTION delete_tenant(target_tenant_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_role TEXT;
  caller_email TEXT;
BEGIN
  -- Super admin check (wallace@anyismart.com)
  SELECT email INTO caller_email FROM auth.users WHERE id = auth.uid();
  IF caller_email = 'wallace@anyismart.com' THEN
    DELETE FROM public.tenants WHERE id = target_tenant_id;
    RETURN;
  END IF;

  -- Check if caller is owner
  SELECT role INTO caller_role FROM public.tenant_users 
  WHERE tenant_id = target_tenant_id AND user_id = auth.uid();

  IF caller_role = 'owner' THEN
    DELETE FROM public.tenants WHERE id = target_tenant_id;
  ELSE
    RAISE EXCEPTION 'Not authorized to delete this company.';
  END IF;
END;
$$;
