-- Migration: Drop legacy profiles_id_fkey constraint and fix stores foreign keys
-- Description: Drops legacy "profiles_id_fkey" from stores table so stores.id can be an independent UUID, and ensures owner_id is the sole reference to users.id

DO $$
BEGIN
    -- 1. DROP LEGACY FOREIGN KEY ON stores.id IF EXISTS
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' 
        AND table_name = 'stores' 
        AND constraint_name = 'profiles_id_fkey'
    ) THEN
        ALTER TABLE public.stores DROP CONSTRAINT profiles_id_fkey;
    END IF;

    -- Also check for stores_id_fkey if postgres auto-renamed it
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' 
        AND table_name = 'stores' 
        AND constraint_name = 'stores_id_fkey'
    ) THEN
        ALTER TABLE public.stores DROP CONSTRAINT stores_id_fkey;
    END IF;

    -- 2. ENSURE ALL AUTH USERS ARE IN public.users FIRST
    INSERT INTO public.users (id, email, full_name, avatar_url, provider, created_at, updated_at)
    SELECT 
        id, 
        email, 
        COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1)),
        raw_user_meta_data->>'avatar_url',
        COALESCE(raw_app_meta_data->>'provider', 'email'),
        created_at,
        COALESCE(updated_at, created_at)
    FROM auth.users
    ON CONFLICT (id) DO UPDATE 
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = now();

    -- 3. ENSURE stores.owner_id HAS PROPER FK TO public.users(id)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' 
        AND table_name = 'stores' 
        AND constraint_name = 'fk_stores_owner_id'
    ) THEN
        ALTER TABLE public.stores 
        ADD CONSTRAINT fk_stores_owner_id 
        FOREIGN KEY (owner_id) 
        REFERENCES public.users(id) 
        ON DELETE CASCADE;
    END IF;

    -- 4. ENSURE stores.id DEFAULTS TO gen_random_uuid()
    ALTER TABLE public.stores ALTER COLUMN id SET DEFAULT gen_random_uuid();

END $$;
