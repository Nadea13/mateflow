-- Migrations for Role-Based Access Control (RBAC)

-- 1. Add role to profiles if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='role') THEN
        ALTER TABLE public.profiles ADD COLUMN role text DEFAULT 'owner';
    END IF;
END $$;

-- 2. Ensure existing profiles default to 'owner'
UPDATE public.profiles SET role = 'owner' WHERE role IS NULL;

-- 3. (Optional for V1, but good practice) Add owner_id for future multi-tenant relationships
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='owner_id') THEN
        ALTER TABLE public.profiles ADD COLUMN owner_id uuid REFERENCES auth.users(id);
    END IF;
END $$;

-- 4. Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
