-- ==========================================
-- Mateflow Secure Team Management & RLS
-- ==========================================

-- 0. ADD MISSING COLUMNS (In case previous migrations were skipped/rolled back)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='email') THEN
        ALTER TABLE public.profiles ADD COLUMN email text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='role') THEN
        ALTER TABLE public.profiles ADD COLUMN role text DEFAULT 'owner';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='owner_id') THEN
        ALTER TABLE public.profiles ADD COLUMN owner_id uuid REFERENCES auth.users(id);
    END IF;
END $$;

-- 1. UTILITY FUNCTION: GET STORE ID
-- This function securely gets the "store_id" (which is the owner_id) for the current user.
-- If the user is an owner, it returns their own uid.
-- If the user is a team member, it returns their owner_id.
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

    -- Look up the user's profile to find their owner_id
    SELECT owner_id INTO v_owner_id FROM profiles WHERE id = v_uid;

    -- If owner_id is set, they are a team member, so return their owner_id (store_id)
    -- If owner_id is null, they are the owner, so return their own id
    IF v_owner_id IS NOT NULL THEN
        RETURN v_owner_id;
    ELSE
        RETURN v_uid;
    END IF;
END;
$$;


-- 2. CREATE INVITATIONS TABLE
CREATE TABLE IF NOT EXISTS public.invitations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    email text NOT NULL,
    role text NOT NULL DEFAULT 'sales',
    token uuid DEFAULT gen_random_uuid() NOT NULL UNIQUE,
    expires_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- RLS for invitations
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Owners can see invitations they created
DROP POLICY IF EXISTS "Owners can view their invitations" ON public.invitations;
CREATE POLICY "Owners can view their invitations"
    ON public.invitations
    FOR SELECT
    USING (store_id = auth.uid());

-- Owners can insert/delete invitations for their store
DROP POLICY IF EXISTS "Owners can insert their invitations" ON public.invitations;
CREATE POLICY "Owners can insert their invitations"
    ON public.invitations
    FOR INSERT
    WITH CHECK (store_id = auth.uid());

DROP POLICY IF EXISTS "Owners can delete their invitations" ON public.invitations;

CREATE POLICY "Owners can delete their invitations"
    ON public.invitations
    FOR DELETE
    USING (store_id = auth.uid());


-- 3. RPC: CREATE INVITATION
CREATE OR REPLACE FUNCTION public.create_invitation(invite_email text, invite_role text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_store_id uuid;
    v_token uuid;
    v_existing_profile_id uuid;
BEGIN
    v_store_id := auth.uid();
    IF v_store_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    -- Ensure the user creating the invite is actually the owner of the store
    -- They must have a null owner_id themselves (or we explicitly check their role)
    IF EXISTS (SELECT 1 FROM profiles WHERE id = v_store_id AND owner_id IS NOT NULL) THEN
        RAISE EXCEPTION 'Only team owners can invite members';
    END IF;

    -- Check if the email is already part of the team
    SELECT id INTO v_existing_profile_id FROM profiles WHERE email = invite_email;
    IF v_existing_profile_id IS NOT NULL THEN
        -- Check if they are already in THIS team
        IF EXISTS (SELECT 1 FROM profiles WHERE id = v_existing_profile_id AND (id = v_store_id OR owner_id = v_store_id)) THEN
             RAISE EXCEPTION 'User is already a member of this team';
        END IF;
        -- Note: If they exist but belong to another team or are their own owner, we still allow sending the invite.
        -- When they accept, it will overwrite their owner_id (effectively moving them to this team).
    END IF;

    -- Delete any existing pending invitations for this email + store combo
    DELETE FROM invitations WHERE store_id = v_store_id AND email = invite_email;

    -- Insert new invitation (expires in 7 days)
    INSERT INTO invitations (store_id, email, role, expires_at)
    VALUES (v_store_id, invite_email, invite_role, now() + interval '7 days')
    RETURNING token INTO v_token;

    RETURN v_token;
END;
$$;


-- 4. RPC: ACCEPT INVITATION
CREATE OR REPLACE FUNCTION public.accept_invitation(invite_token uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    v_store_id uuid;
    v_invite_email text;
    v_invite_role text;
    v_user_email text;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    -- Get the user's current email directly from auth.users to ensure it's up to date
    SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;

    -- Find the active invitation
    SELECT store_id, email, role INTO v_store_id, v_invite_email, v_invite_role
    FROM invitations
    WHERE token = invite_token AND expires_at > now();

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invitation token is invalid or expired';
    END IF;

    -- Strict check: Currently, we might want to ensure the logged-in user's email matches the invite email.
    -- If you want to allow them to accept an invite sent to a different email they own, you can relax this.
    -- Let's enforce it for security.
    IF v_user_email IS NULL OR lower(v_user_email) != lower(v_invite_email) THEN
         RAISE EXCEPTION 'This invitation was sent to a different email address. Expected: %, Got: %', v_invite_email, COALESCE(v_user_email, 'NULL');
    END IF;
    
    IF v_user_id = v_store_id THEN 
        RAISE EXCEPTION 'Cannot join own team'; 
    END IF;

    -- Update the user's profile
    UPDATE profiles
    SET owner_id = v_store_id, role = v_invite_role, email = COALESCE(email, v_user_email)
    WHERE id = v_user_id;

    -- Clean up the used invitation
    DELETE FROM invitations WHERE token = invite_token;

    RETURN true;
END;
$$;

-- 5. RPC: REVOKE INVITATION
CREATE OR REPLACE FUNCTION public.revoke_invitation(invite_id uuid)
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

    DELETE FROM invitations WHERE id = invite_id AND store_id = v_store_id;

    RETURN FOUND;
END;
$$;


-- 6. RPC: GET TEAM MEMBERS
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

-- 7. RPC: UPDATE TEAM MEMBER ROLE
CREATE OR REPLACE FUNCTION public.update_team_member_role(member_id uuid, new_role text)
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

    -- Only the owner can update roles
    UPDATE profiles
    SET role = new_role
    WHERE id = member_id AND owner_id = v_store_id;

    RETURN FOUND;
END;
$$;

-- 8. RPC: REMOVE TEAM MEMBER
CREATE OR REPLACE FUNCTION public.remove_team_member(member_id uuid)
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

    -- Only the owner can remove members. We reset their owner_id and role.
    UPDATE profiles
    SET owner_id = NULL, role = 'owner'
    WHERE id = member_id AND owner_id = v_store_id;

    RETURN FOUND;
END;
$$;


-- ==========================================
-- UPDATE DATA TABLE RLS POLICIES FOR TEAMS
-- ==========================================
-- We replace existing policies to use `public.get_store_id()`
-- Note: Requires recreating the policies.

DO $$
DECLARE
    v_table_name text;
    tables_to_update text[] := ARRAY['profiles', 'products', 'customers', 'bills', 'expenses', 'suppliers', 'purchase_orders'];
BEGIN
    FOREACH v_table_name IN ARRAY tables_to_update
    LOOP
        -- Check if table exists before trying to update policies
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = v_table_name) THEN
            
            -- Keep a careful approach on `profiles` specifically
            IF v_table_name = 'profiles' THEN
                -- Profiles: User can see themselves, OR owner can see team members, OR team member can see owner/team members
                DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
                DROP POLICY IF EXISTS "Users can view their team" ON public.profiles;
                DROP POLICY IF EXISTS "Team profile access" ON public.profiles;
                
                CREATE POLICY "Team profile access"
                    ON public.profiles
                    FOR SELECT
                    USING (
                        id = auth.uid() OR -- View self
                        id = public.get_store_id() OR -- View owner
                        owner_id = public.get_store_id() -- View team members
                    );
                    
                -- Updates to profile are only for self, OR owner updating team member roles
                DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
                DROP POLICY IF EXISTS "Team profile update" ON public.profiles;

                CREATE POLICY "Team profile update"
                    ON public.profiles
                    FOR UPDATE
                    USING (
                        id = auth.uid() OR -- Update self
                        (auth.uid() = public.get_store_id() AND owner_id = auth.uid()) -- Owner updating employee
                    );
                    
            ELSE
                 -- For regular data tables (e.g. bills, products)
                 -- Assuming all these tables have an `user_id` column that historically stored the owner's id.
                 
                 -- If the column is named something else, we might need a manual switch statement.
                 -- Based on migrations, it's usually `user_id`
                 IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=v_table_name AND column_name='user_id') THEN
                     -- Standard drop old policies (we drop common names if they exist)
                     EXECUTE format('DROP POLICY IF EXISTS "Users can view own %I" ON public.%I', v_table_name, v_table_name);
                     EXECUTE format('DROP POLICY IF EXISTS "Users can create own %I" ON public.%I', v_table_name, v_table_name);
                     EXECUTE format('DROP POLICY IF EXISTS "Users can update own %I" ON public.%I', v_table_name, v_table_name);
                     EXECUTE format('DROP POLICY IF EXISTS "Users can delete own %I" ON public.%I', v_table_name, v_table_name);
                     EXECUTE format('DROP POLICY IF EXISTS "Team access to %I" ON public.%I', v_table_name, v_table_name);

                     -- Create unified Team Access policy
                     EXECUTE format('
                        CREATE POLICY "Team access to %I"
                        ON public.%I
                        FOR ALL 
                        USING (user_id = public.get_store_id())
                        WITH CHECK (user_id = public.get_store_id());
                     ', v_table_name, v_table_name);
                 END IF;
            END IF;
        END IF;
    END LOOP;
END;
$$;

-- Schema Reload
NOTIFY pgrst, 'reload schema';
