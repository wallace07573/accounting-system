-- Function to get auction records with creator email and remark
DROP FUNCTION IF EXISTS get_auction_records_with_creator(uuid);

CREATE OR REPLACE FUNCTION get_auction_records_with_creator(p_tenant_id UUID)
RETURNS TABLE (
    id UUID,
    tenant_id UUID,
    date DATE,
    name TEXT,
    phone_number TEXT,
    auction_room TEXT,
    no TEXT,
    auc_no TEXT,
    amount NUMERIC,
    remark TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    customer_id UUID,
    creator_email VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Authorization check
    IF NOT EXISTS (
        SELECT 1 FROM public.tenant_users 
        WHERE public.tenant_users.tenant_id = p_tenant_id 
        AND public.tenant_users.user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    RETURN QUERY
    SELECT 
        ar.id,
        ar.tenant_id,
        ar.date,
        ar.name,
        ar.phone_number,
        ar.auction_room,
        ar.no,
        ar.auc_no,
        ar.amount,
        ar.remark,
        ar.created_at,
        ar.created_by,
        ar.customer_id,
        au.email::VARCHAR AS creator_email
    FROM public.auction_records ar
    LEFT JOIN auth.users au ON ar.created_by = au.id
    WHERE ar.tenant_id = p_tenant_id
    -- Replicate RLS logic for SECURITY DEFINER:
    AND EXISTS (
        SELECT 1 FROM public.tenant_users tu
        WHERE tu.tenant_id = ar.tenant_id
        AND tu.user_id = auth.uid()
        AND (tu.role NOT IN ('staff', 'member') OR ar.created_by = auth.uid())
    )
    ORDER BY ar.date DESC, ar.created_at DESC;
END;
$$;
