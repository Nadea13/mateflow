-- ==========================================
-- Mateflow Role-Specific Code-Based Team Join
-- ==========================================

-- 1. DROP THE OLD INVITATION SYSTEM
DROP TABLE IF EXISTS public.invitations CASCADE;
DROP FUNCTION IF EXISTS public.create_invitation(text, text);
DROP FUNCTION IF EXISTS public.accept_invitation(uuid);
DROP FUNCTION IF EXISTS public.revoke_invitation(uuid);

-- Remove the old store_code column from profiles if it exists from the previous attempt
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='store_code') THEN
        ALTER TABLE public.profiles DROP COLUMN store_code;
    END IF;
END $$;

-- 2. CREATE STORE CODES TABLE
CREATE TABLE IF NOT EXISTS public.store_codes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    code text NOT NULL UNIQUE,
    role text NOT NULL DEFAULT 'sales',
    created_at timestamptz DEFAULT now() NOT NULL
);

-- RLS for store_codes
ALTER TABLE public.store_codes ENABLE ROW LEVEL SECURITY;

-- Owners can view their store codes
DROP POLICY IF EXISTS "Owners can view their store codes" ON public.store_codes;
CREATE POLICY "Owners can view their store codes"
    ON public.store_codes
    FOR SELECT
    USING (store_id = auth.uid());

-- Owners can manage their store codes
DROP POLICY IF EXISTS "Owners can manage their store codes" ON public.store_codes;
CREATE POLICY "Owners can manage their store codes"
    ON public.store_codes
    FOR ALL
    USING (store_id = auth.uid());

-- 3. RPC: GENERATE STORE CODE FOR ROLE
-- Generates a random 6-character uppercase alphanumeric code mapped to a specific role.
CREATE OR REPLACE FUNCTION public.generate_store_code(p_role text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_store_id uuid;
    v_new_code text;
    v_is_unique boolean := false;
BEGIN
    v_store_id := auth.uid();
    IF v_store_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    -- Ensure caller is an owner
    IF EXISTS (SELECT 1 FROM profiles WHERE id = v_store_id AND owner_id IS NOT NULL) THEN
        RAISE EXCEPTION 'Only store owners can generate a join code';
    END IF;

    -- Optional: Only allow 1 active code per role per store to prevent clutter
    DELETE FROM store_codes WHERE store_id = v_store_id AND role = p_role;

    -- Loop until we find a unique code
    WHILE NOT v_is_unique LOOP
        -- Generate 6 uppercase random letters/numbers
        v_new_code := upper(substring(md5(random()::text) from 1 for 6));
        
        -- Check if it already exists globally
        IF NOT EXISTS (SELECT 1 FROM store_codes WHERE code = v_new_code) THEN
            v_is_unique := true;
        END IF;
    END LOOP;

    -- Insert the new code
    INSERT INTO store_codes (store_id, code, role)
    VALUES (v_store_id, v_new_code, p_role);

    RETURN v_new_code;
END;
$$;


-- 4. RPC: JOIN STORE BY CODE
-- Allows any authenticated user to enter a store code and become a team member with the specified role.
CREATE OR REPLACE FUNCTION public.join_store_by_code(p_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    v_target_store_id uuid;
    v_target_role text;
    v_user_email text;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated / Please log in first'; END IF;

    -- Clean the code
    p_code := upper(trim(p_code));

    -- Find the store and role mapping from the code
    SELECT store_id, role INTO v_target_store_id, v_target_role
    FROM store_codes 
    WHERE code = p_code;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid or expired Store Code';
    END IF;

    -- You cannot join your own store
    IF v_user_id = v_target_store_id THEN 
        RAISE EXCEPTION 'You are already the owner of this store'; 
    END IF;

    -- Sync user email to profiles table if missing
    SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;

    -- Update the user's profile to belong to this store id with the associated role
    UPDATE profiles
    SET owner_id = v_target_store_id, 
        role = v_target_role,
        email = COALESCE(email, v_user_email)
    WHERE id = v_user_id;

    -- Optional: We do NOT delete the code because the user wants it to be a permanent invite link.
    -- If they want codes to be one-time use, we would add: `DELETE FROM store_codes WHERE code = p_code;` here.

    RETURN true;
END;
$$;

-- 5. RPC: REVOKE STORE CODE
CREATE OR REPLACE FUNCTION public.revoke_store_code(p_code_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_store_id uuid;
BEGIN
    v_store_id := auth.uid();
    IF v_store_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    DELETE FROM store_codes WHERE id = p_code_id AND store_id = v_store_id;

    RETURN FOUND;
END;
$$;

-- Schema Reload
NOTIFY pgrst, 'reload schema';
