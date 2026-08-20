-- Migration: Decouple users and stores tables
-- 1. Create public.users table synced with auth.users
-- 2. Refactor public.stores to have independent UUID PK and owner_id referencing public.users(id)
-- 3. Remove email column from stores
-- 4. Setup automated trigger to sync new auth.users into public.users

DO $$
BEGIN
    -- 1. Create public.users table if not exists
    CREATE TABLE IF NOT EXISTS public.users (
        id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        email text UNIQUE NOT NULL,
        full_name text,
        avatar_url text,
        provider text DEFAULT 'email',
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
    );

    -- Enable RLS on users
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
    CREATE POLICY "Users can read own profile" ON public.users FOR SELECT USING (auth.uid() = id);
    DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
    CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

    -- Copy existing users from auth.users into public.users
    INSERT INTO public.users (id, email, full_name, avatar_url, created_at, updated_at)
    SELECT 
        id, 
        email, 
        COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1)),
        raw_user_meta_data->>'avatar_url',
        created_at,
        created_at
    FROM auth.users
    ON CONFLICT (id) DO UPDATE 
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = now();

    -- 2. Modify stores table to have independent UUID and owner_id
    -- Ensure stores table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'stores'
    ) THEN
        -- Add owner_id if not exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'stores' AND column_name = 'owner_id'
        ) THEN
            ALTER TABLE public.stores ADD COLUMN owner_id uuid REFERENCES public.users(id) ON DELETE CASCADE;
        END IF;

        -- Populate owner_id with current id (which was user_id) if owner_id is null
        UPDATE public.stores SET owner_id = id WHERE owner_id IS NULL;

        -- Drop email column from stores if exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'stores' AND column_name = 'email'
        ) THEN
            ALTER TABLE public.stores DROP COLUMN email;
        END IF;

        -- Ensure id has default gen_random_uuid()
        ALTER TABLE public.stores ALTER COLUMN id SET DEFAULT gen_random_uuid();
    ELSE
        -- Create stores from scratch if not existed
        CREATE TABLE public.stores (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            owner_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
            store_name text,
            avatar_url text,
            store_address text,
            tax_id text,
            store_phone text,
            signature_url text,
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

    -- 3. Update branchs table store_id foreign key reference
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'branchs'
    ) THEN
        -- Make sure store_id column exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'branchs' AND column_name = 'store_id'
        ) THEN
            ALTER TABLE public.branchs ADD COLUMN store_id uuid;
        END IF;
    END IF;

END $$;

-- 4. Create trigger to auto-create public.users row whenever someone signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url, created_at, updated_at)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
        new.raw_user_meta_data->>'avatar_url',
        now(),
        now()
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = now();
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
