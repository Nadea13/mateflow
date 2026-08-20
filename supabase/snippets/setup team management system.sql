-- 1. สร้างตาราง store_codes (เก็บรหัสเชิญเข้าร้าน)
CREATE TABLE IF NOT EXISTS public.store_codes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    code text UNIQUE NOT NULL,
    role text NOT NULL DEFAULT 'sales',
    branch_id uuid REFERENCES public.branchs(id) ON DELETE SET NULL,
    created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now()
);

-- 2. สร้างตาราง store_team_members (เก็บรายชื่อพนักงานในร้านและสาขาที่ดูแล)
CREATE TABLE IF NOT EXISTS public.store_team_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    role text NOT NULL DEFAULT 'sales',
    assigned_branch_id uuid REFERENCES public.branchs(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(store_id, user_id)
);

ALTER TABLE public.store_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated to manage store_codes" ON public.store_codes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated to manage store_team_members" ON public.store_team_members FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. ฟังก์ชันสร้างรหัสร้านค้าอัตโนมัติ (เช่น MF-A8B9C2)
CREATE OR REPLACE FUNCTION public.generate_store_code(
    p_role text DEFAULT 'sales',
    p_store_id uuid DEFAULT NULL,
    p_branch_id uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
    v_store_id uuid;
    v_code text;
    v_new_record record;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF p_store_id IS NOT NULL THEN
        v_store_id := p_store_id;
    ELSE
        SELECT id INTO v_store_id FROM public.stores WHERE owner_id = v_user_id ORDER BY created_at ASC LIMIT 1;
    END IF;

    IF v_store_id IS NULL THEN
        RAISE EXCEPTION 'Store not found for current user';
    END IF;

    v_code := 'MF-' || UPPER(SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 6));

    INSERT INTO public.store_codes (store_id, code, role, branch_id, created_by)
    VALUES (v_store_id, v_code, p_role, p_branch_id, v_user_id)
    RETURNING * INTO v_new_record;

    RETURN row_to_json(v_new_record);
END;
$$;