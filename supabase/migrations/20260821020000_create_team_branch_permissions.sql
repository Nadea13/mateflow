-- Migration: Add branch_id and permissions to store_team_members
-- Description: Allows assigning staff/managers to specific branches or granting all-branch access

DO $$
BEGIN
    -- 1. Create store_team_members table
    CREATE TABLE IF NOT EXISTS public.store_team_members (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
        user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
        role text NOT NULL DEFAULT 'sales', -- 'owner', 'manager', 'sales', 'stock_keeper'
        assigned_branch_id uuid REFERENCES public.branchs(id) ON DELETE SET NULL, -- NULL means All Branches
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now(),
        UNIQUE(store_id, user_id)
    );

    -- 2. Enable RLS
    ALTER TABLE public.store_team_members ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Allow authenticated to manage store_team_members" ON public.store_team_members;
    CREATE POLICY "Allow authenticated to manage store_team_members" 
    ON public.store_team_members 
    FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

END $$;
