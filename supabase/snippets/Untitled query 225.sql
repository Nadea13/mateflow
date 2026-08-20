-- 1. ลบคอลัมน์ branch_id ออกจาก store_codes และ assigned_branch_id ออกจาก store_team_members
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'store_codes' 
        AND column_name = 'branch_id'
    ) THEN
        ALTER TABLE public.store_codes DROP COLUMN branch_id;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'store_team_members' 
        AND column_name = 'assigned_branch_id'
    ) THEN
        ALTER TABLE public.store_team_members DROP COLUMN assigned_branch_id;
    END IF;
END $$;

-- 2. ปรับปรุงฟังก์ชัน generate_store_code (ตัดการรับค่าสาขาออก)
CREATE OR REPLACE FUNCTION public.generate_store_code(
    p_role text DEFAULT 'sales',
    p_store_id uuid DEFAULT NULL
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

    INSERT INTO public.store_codes (store_id, code, role, created_by)
    VALUES (v_store_id, v_code, p_role, v_user_id)
    RETURNING * INTO v_new_record;

    RETURN row_to_json(v_new_record);
END;
$$;

-- 3. ปรับปรุงฟังก์ชัน join_store_by_code (ตัดการบันทึกสาขาออก)
CREATE OR REPLACE FUNCTION public.join_store_by_code(p_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
    v_code_record record;
    v_existing record;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT * INTO v_code_record FROM public.store_codes WHERE UPPER(code) = UPPER(TRIM(p_code)) LIMIT 1;

    IF v_code_record IS NULL THEN
        RAISE EXCEPTION 'Invalid or expired store join code';
    END IF;

    SELECT * INTO v_existing FROM public.store_team_members WHERE store_id = v_code_record.store_id AND user_id = v_user_id;

    IF v_existing IS NOT NULL THEN
        UPDATE public.store_team_members 
        SET role = v_code_record.role, 
            updated_at = now()
        WHERE id = v_existing.id;
    ELSE
        INSERT INTO public.store_team_members (store_id, user_id, role)
        VALUES (v_code_record.store_id, v_user_id, v_code_record.role);
    END IF;

    RETURN json_build_object('success', true, 'store_id', v_code_record.store_id, 'role', v_code_record.role);
END;
$$;