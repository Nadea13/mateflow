-- ==========================================
-- Mateflow Team Data Access Fix (Execute in Supabase SQL Editor)
-- ==========================================

-- 1. UTILITY: GET STORE ID
-- Retrieves the Owner ID if the user is a team member, or their own ID if they are the owner.
CREATE OR REPLACE FUNCTION public.get_store_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid uuid;
    v_owner_id uuid;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT owner_id INTO v_owner_id FROM profiles WHERE id = v_uid;

    IF v_owner_id IS NOT NULL THEN
        RETURN v_owner_id;
    ELSE
        RETURN v_uid;
    END IF;
END;
$$;

-- 2. TRIGGER: AUTO-ASSIGN STORE ID ON INSERT
-- Whenever a sales/admin employee creates a product/bill, we MUST save it under the Owner's ID so the whole team sees it.
CREATE OR REPLACE FUNCTION public.set_team_user_id()
RETURNS trigger AS $$
DECLARE
    v_store_id uuid;
BEGIN
    v_store_id := public.get_store_id();
    IF v_store_id IS NOT NULL THEN
        NEW.user_id := v_store_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply Trigger and RLS to all business tables
DO $$
DECLARE
    v_table_name text;
    tables_to_update text[] := ARRAY['products', 'customers', 'bills', 'expenses', 'suppliers', 'purchase_orders'];
BEGIN
    FOREACH v_table_name IN ARRAY tables_to_update
    LOOP
        -- Check if table exists
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = v_table_name) THEN
            
            -- Apply BEFORE INSERT trigger
            EXECUTE format('DROP TRIGGER IF EXISTS trg_set_team_user_id_%I ON public.%I', v_table_name, v_table_name);
            EXECUTE format('
                CREATE TRIGGER trg_set_team_user_id_%I
                BEFORE INSERT ON public.%I
                FOR EACH ROW
                EXECUTE FUNCTION public.set_team_user_id();
            ', v_table_name, v_table_name);

            -- Ensure RLS is enabled
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', v_table_name);

            -- DROP ANY OLD POLICIES that were locking data to individual users
            EXECUTE format('DROP POLICY IF EXISTS "Users can view own %I" ON public.%I', v_table_name, v_table_name);
            EXECUTE format('DROP POLICY IF EXISTS "Users can create own %I" ON public.%I', v_table_name, v_table_name);
            EXECUTE format('DROP POLICY IF EXISTS "Users can update own %I" ON public.%I', v_table_name, v_table_name);
            EXECUTE format('DROP POLICY IF EXISTS "Users can delete own %I" ON public.%I', v_table_name, v_table_name);
            EXECUTE format('DROP POLICY IF EXISTS "Team access to %I" ON public.%I', v_table_name, v_table_name);

            -- CREATE THE NEW UNIFIED TEAM POLICY
            -- This single policy says: "If the row''s user_id matches the Store ID, the team can read/write to it."
            EXECUTE format('
                CREATE POLICY "Team access to %I"
                ON public.%I
                FOR ALL 
                USING (user_id = public.get_store_id())
                WITH CHECK (user_id = public.get_store_id());
            ', v_table_name, v_table_name);
            
        END IF;
    END LOOP;
END;
$$;

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
