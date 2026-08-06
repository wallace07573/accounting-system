-- Add DELETE policy for tenant_users so owners/super_admins can remove staff, and users can leave
CREATE POLICY "Allow owners and super_admins to delete members"
    ON public.tenant_users FOR DELETE
    USING (
      -- The user performing the delete is an owner or super_admin of this tenant
      EXISTS (
        SELECT 1 FROM public.tenant_users tu 
        WHERE tu.tenant_id = tenant_users.tenant_id 
        AND tu.user_id = auth.uid() 
        AND tu.role IN ('owner', 'super_admin')
      )
      -- Or the user is removing themselves
      OR user_id = auth.uid()
    );

-- Also add an UPDATE policy just in case we need to change roles in the future
CREATE POLICY "Allow owners and super_admins to update members"
    ON public.tenant_users FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM public.tenant_users tu 
        WHERE tu.tenant_id = tenant_users.tenant_id 
        AND tu.user_id = auth.uid() 
        AND tu.role IN ('owner', 'super_admin')
      )
    );
