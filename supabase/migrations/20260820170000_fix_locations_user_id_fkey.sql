-- Migration: Drop legacy locations_user_id_fkey from branchs table and set store_id FK
-- Description: Drops legacy constraint locations_user_id_fkey pointing to auth.users, and enforces store_id -> public.stores(id)

DO $$
BEGIN
    -- 1. DROP LEGACY FOREIGN KEYS ON branchs / locations TABLE
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' 
        AND table_name = 'branchs' 
        AND constraint_name = 'locations_user_id_fkey'
    ) THEN
        ALTER TABLE public.branchs DROP CONSTRAINT locations_user_id_fkey;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' 
        AND table_name = 'branchs' 
        AND constraint_name = 'branchs_user_id_fkey'
    ) THEN
        ALTER TABLE public.branchs DROP CONSTRAINT branchs_user_id_fkey;
    END IF;

    -- Also check if locations table exists and has old fkey
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' 
        AND table_name = 'locations' 
        AND constraint_name = 'locations_user_id_fkey'
    ) THEN
        ALTER TABLE public.locations DROP CONSTRAINT locations_user_id_fkey;
    END IF;

    -- 2. ENSURE store_id COLUMN EXISTS ON branchs
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'branchs') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'branchs' AND column_name = 'store_id') THEN
            ALTER TABLE public.branchs ADD COLUMN store_id uuid;
        END IF;

        -- 3. ENSURE FOREIGN KEY: branchs.store_id -> public.stores(id)
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_type = 'FOREIGN KEY' 
            AND table_name = 'branchs' 
            AND constraint_name = 'fk_branchs_store_id'
        ) THEN
            ALTER TABLE public.branchs 
            ADD CONSTRAINT fk_branchs_store_id 
            FOREIGN KEY (store_id) 
            REFERENCES public.stores(id) 
            ON DELETE CASCADE;
        END IF;
    END IF;

END $$;
