-- Migration: Rename profiles to stores, locations to branchs, and rename user_id to store_id on branchs
-- Description: Modernizes schema from single user profile to multi-store & multi-branch architecture

DO $$
BEGIN
    -- 1. Rename profiles table to stores if profiles exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'profiles'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'stores'
    ) THEN
        ALTER TABLE public.profiles RENAME TO stores;
    END IF;

    -- 2. Rename locations table to branchs if locations exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'locations'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'branchs'
    ) THEN
        ALTER TABLE public.locations RENAME TO branchs;
    END IF;

    -- 3. Rename user_id column to store_id on branchs table if user_id exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'branchs' 
        AND column_name = 'user_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'branchs' 
        AND column_name = 'store_id'
    ) THEN
        ALTER TABLE public.branchs RENAME COLUMN user_id TO store_id;
    END IF;

    -- 4. In case branchs table is created fresh without locations table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'branchs'
    ) THEN
        CREATE TABLE public.branchs (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            store_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
            name text NOT NULL,
            code text,
            type text DEFAULT 'warehouse',
            country text DEFAULT 'TH',
            address text,
            created_at timestamptz DEFAULT now(),
            updated_at timestamptz DEFAULT now()
        );
        ALTER TABLE public.branchs ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Users can manage branchs" ON public.branchs FOR ALL USING (true) WITH CHECK (true);
    END IF;

    -- 5. In case stores table is created fresh
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'stores'
    ) THEN
        CREATE TABLE public.stores (
            id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            email text,
            store_name text,
            avatar_url text,
            store_address text,
            tax_id text,
            store_phone text,
            signature_url text,
            owner_id uuid,
            role text DEFAULT 'owner',
            default_currency text DEFAULT 'THB',
            country text DEFAULT 'TH',
            tax_rate numeric DEFAULT 7,
            stripe_customer_id text,
            stripe_subscription_id text,
            subscription_tier text DEFAULT 'free',
            subscription_status text DEFAULT 'active',
            current_period_end timestamptz,
            etax_enabled boolean DEFAULT false,
            etax_api_key text,
            etax_company_id text,
            stripe_publishable_key text,
            stripe_secret_key text,
            created_at timestamptz DEFAULT now(),
            updated_at timestamptz DEFAULT now()
        );
        ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Users can manage own stores" ON public.stores FOR ALL USING (true) WITH CHECK (true);
    END IF;

END $$;
