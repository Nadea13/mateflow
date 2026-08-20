-- ==========================================
-- Mateflow Team Management & Invite Link SQL
-- ==========================================
-- Run this entire file in the Supabase SQL Editor.
-- It will automatically add missing columns, set up the Email sync trigger,
-- and create/replace all necessary RPC functions for the Invite Link system.

-- 1. ADD COLUMNS (idempotent, won't crash if they already exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='email') THEN
        ALTER TABLE public.profiles ADD COLUMN email text;
    END IF;
    -- Note: 'role' and 'owner_id' columns were added in 20240226_rbac_roles.sql
END $$;


-- 2. BACKFILL EMAILS (Only works if ran by a superuser/postgres role)
-- This ensures existing users get their emails copied from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;


-- 3. AUTO-SYNC EMAILS TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_auth_user_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.profiles (id, email, role)
    VALUES (NEW.id, NEW.email, 'owner')
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.profiles
    SET email = NEW.email
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_changes ON auth.users;
CREATE TRIGGER on_auth_user_changes
  AFTER INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_changes();


-- 4. RPC: GET TEAM MEMBERS (Owner fetches their team)
CREATE OR REPLACE FUNCTION public.get_team_members()
RETURNS SETOF public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_owner_id uuid;
BEGIN
    v_owner_id := auth.uid();
    IF v_owner_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    RETURN QUERY
    SELECT * FROM profiles WHERE owner_id = v_owner_id ORDER BY updated_at DESC;
END;
$$;


-- 5. RPC: UPDATE TEAM MEMBER ROLE (Owner updates employee role)
CREATE OR REPLACE FUNCTION public.update_team_member_role(member_id uuid, new_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_owner_id uuid;
BEGIN
    v_owner_id := auth.uid();
    IF v_owner_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    UPDATE profiles
    SET role = new_role
    WHERE id = member_id AND owner_id = v_owner_id;

    IF NOT FOUND THEN RAISE EXCEPTION 'Member not found or permission denied'; END IF;

    RETURN true;
END;
$$;


-- 6. RPC: REMOVE TEAM MEMBER (Owner removes employee)
CREATE OR REPLACE FUNCTION public.remove_team_member(member_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_owner_id uuid;
BEGIN
    v_owner_id := auth.uid();
    IF v_owner_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    -- Unlink the user and reset them to 'owner' so they can manage their own individual store again
    UPDATE profiles
    SET owner_id = null, role = 'owner'
    WHERE id = member_id AND owner_id = v_owner_id;

    IF NOT FOUND THEN RAISE EXCEPTION 'Member not found or permission denied'; END IF;

    RETURN true;
END;
$$;


-- 7. RPC: JOIN TEAM (Employee clicks Invite Link)
CREATE OR REPLACE FUNCTION public.join_team(store_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_target_id uuid;
    v_owner_profile_exists boolean;
BEGIN
    v_target_id := auth.uid();
    IF v_target_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    -- Verify the store_id exists
    SELECT EXISTS (SELECT 1 FROM profiles WHERE id = store_id) INTO v_owner_profile_exists;
    IF NOT v_owner_profile_exists THEN RAISE EXCEPTION 'Store owner not found'; END IF;
    IF v_target_id = store_id THEN RAISE EXCEPTION 'Cannot join own team'; END IF;

    -- Update the caller's profile to become a 'sales' staff of the store_id
    UPDATE profiles
    SET owner_id = store_id, role = 'sales'
    WHERE id = v_target_id;

    RETURN true;
END;
$$;


-- 8. RELOAD SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
