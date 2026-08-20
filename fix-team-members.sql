-- 6. RPC: GET TEAM MEMBERS FIX
CREATE OR REPLACE FUNCTION public.get_team_members()
RETURNS TABLE (
    id uuid,
    email text,
    role text,
    created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_store_id uuid;
BEGIN
    v_store_id := public.get_store_id();
    IF v_store_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    RETURN QUERY
    SELECT p.id, p.email, p.role, p.updated_at as created_at
    FROM profiles p
    WHERE p.owner_id = v_store_id OR p.id = v_store_id;
END;
$$;
