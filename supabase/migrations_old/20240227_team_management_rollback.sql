-- ==========================================
-- Mateflow Team Management & Invite Link ROLLBACK
-- ==========================================
-- Run this entire file in the Supabase SQL Editor.
-- It will remove the email sync trigger, delete all Team RPC functions,
-- and optionally drop the email, role, and owner_id columns from profiles.

-- 1. DROP TRIGGER & FUNCTION
DROP TRIGGER IF EXISTS on_auth_user_changes ON auth.users;
DROP FUNCTION IF EXISTS public.handle_auth_user_changes();

-- 2. DROP ALL TEAM RPC FUNCTIONS
DROP FUNCTION IF EXISTS public.get_team_members();
DROP FUNCTION IF EXISTS public.update_team_member_role(uuid, text);
DROP FUNCTION IF EXISTS public.remove_team_member(uuid);
DROP FUNCTION IF EXISTS public.join_team(uuid);
DROP FUNCTION IF EXISTS public.add_team_member(text, text);

-- 3. REMOVE COLUMNS FROM PROFILES (Optional but recommended for full clean up)
-- WARNING: This deletes the role and email data stored in profiles.
DO $$ 
BEGIN
    -- Drop email column added in Team Management phase
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='profiles' AND column_name='email') THEN
        ALTER TABLE public.profiles DROP COLUMN email;
    END IF;

    -- Drop role and owner_id columns added in V1 RBAC phase
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='profiles' AND column_name='role') THEN
        ALTER TABLE public.profiles DROP COLUMN role;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='profiles' AND column_name='owner_id') THEN
        ALTER TABLE public.profiles DROP COLUMN owner_id;
    END IF;
END $$;

-- 4. RELOAD SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
