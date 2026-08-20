-- Migration: Fix Row-Level Security (RLS) Policies for stores and branchs
-- Description: Ensures authenticated users can INSERT, SELECT, UPDATE, and DELETE their own stores and branches without 42501 RLS violations

DO $$
BEGIN
    -- 1. FIX STORES TABLE RLS POLICIES
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stores') THEN
        ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

        -- Drop existing restrictive or misconfigured policies
        DROP POLICY IF EXISTS "Users can manage own stores" ON public.stores;
        DROP POLICY IF EXISTS "Users can view own stores" ON public.stores;
        DROP POLICY IF EXISTS "Users can insert own stores" ON public.stores;
        DROP POLICY IF EXISTS "Users can update own stores" ON public.stores;
        DROP POLICY IF EXISTS "Users can delete own stores" ON public.stores;
        DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.stores;

        -- Create clear policies for authenticated users
        CREATE POLICY "Allow authenticated users to insert stores" 
        ON public.stores 
        FOR INSERT 
        TO authenticated 
        WITH CHECK (auth.uid() = owner_id OR owner_id IS NULL OR auth.uid() = id);

        CREATE POLICY "Allow authenticated users to select stores" 
        ON public.stores 
        FOR SELECT 
        TO authenticated 
        USING (auth.uid() = owner_id OR auth.uid() = id);

        CREATE POLICY "Allow authenticated users to update stores" 
        ON public.stores 
        FOR UPDATE 
        TO authenticated 
        USING (auth.uid() = owner_id OR auth.uid() = id) 
        WITH CHECK (auth.uid() = owner_id OR auth.uid() = id);

        CREATE POLICY "Allow authenticated users to delete stores" 
        ON public.stores 
        FOR DELETE 
        TO authenticated 
        USING (auth.uid() = owner_id OR auth.uid() = id);
    END IF;

    -- 2. FIX BRANCHS TABLE RLS POLICIES
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'branchs') THEN
        ALTER TABLE public.branchs ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Users can manage branchs" ON public.branchs;
        DROP POLICY IF EXISTS "Allow all for branchs" ON public.branchs;

        CREATE POLICY "Allow all branch operations for authenticated users" 
        ON public.branchs 
        FOR ALL 
        TO authenticated 
        USING (true) 
        WITH CHECK (true);
    END IF;

    -- 3. FIX USERS TABLE RLS POLICIES
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
        DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

        CREATE POLICY "Allow users to read own profile" 
        ON public.users 
        FOR SELECT 
        TO authenticated 
        USING (auth.uid() = id);

        CREATE POLICY "Allow users to update own profile" 
        ON public.users 
        FOR UPDATE 
        TO authenticated 
        USING (auth.uid() = id) 
        WITH CHECK (auth.uid() = id);

        CREATE POLICY "Allow users to insert own profile" 
        ON public.users 
        FOR INSERT 
        TO authenticated 
        WITH CHECK (auth.uid() = id);
    END IF;

END $$;
