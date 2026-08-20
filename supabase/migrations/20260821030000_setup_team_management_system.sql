-- Migration: Complete Team Management System Setup (Idempotent Safe)
-- Tables: store_codes, store_team_members, generate_store_code, join_store_by_code

DO $$
BEGIN
    -- 1. Create store_codes table if not exists
    CREATE TABLE IF NOT EXISTS public.store_codes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
        code text UNIQUE NOT NULL,
        role text NOT NULL DEFAULT 'sales',
        branch_id uuid REFERENCES public.branchs(id) ON DELETE SET NULL,
        created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
        created_at timestamptz DEFAULT now()
    );

    -- 2. Create store_team_members table if not exists
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

    -- Enable RLS
    ALTER TABLE public.store_codes ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.store_team_members ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies first to prevent "already exists" error
    DROP POLICY IF EXISTS "Allow authenticated to manage store_codes" ON public.store_codes;
    CREATE POLICY "Allow authenticated to manage store_codes" ON public.store_codes FOR ALL TO authenticated USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow authenticated to manage store_team_members" ON public.store_team_members;
    CREATE POLICY "Allow authenticated to manage store_team_members" ON public.store_team_members FOR ALL TO authenticated USING (true) WITH CHECK (true);

END $$;

-- 3. FUNCTION: generate_store_code
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

    -- Determine store_id
    IF p_store_id IS NOT NULL THEN
        v_store_id := p_store_id;
    ELSE
        SELECT id INTO v_store_id FROM public.stores WHERE owner_id = v_user_id ORDER BY created_at ASC LIMIT 1;
    END IF;

    IF v_store_id IS NULL THEN
        RAISE EXCEPTION 'Store not found for current user';
    END IF;

    -- Generate random 6-character uppercase code e.g. MF-A8B9C2
    v_code := 'MF-' || UPPER(SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 6));

    INSERT INTO public.store_codes (store_id, code, role, branch_id, created_by)
    VALUES (v_store_id, v_code, p_role, p_branch_id, v_user_id)
    RETURNING * INTO v_new_record;

    RETURN row_to_json(v_new_record);
END;
$$;

-- 4. FUNCTION: join_store_by_code
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
            assigned_branch_id = v_code_record.branch_id, 
            updated_at = now()
        WHERE id = v_existing.id;
    ELSE
        INSERT INTO public.store_team_members (store_id, user_id, role, assigned_branch_id)
        VALUES (v_code_record.store_id, v_user_id, v_code_record.role, v_code_record.branch_id);
    END IF;

    RETURN json_build_object('success', true, 'store_id', v_code_record.store_id, 'role', v_code_record.role);
END;
$$;
