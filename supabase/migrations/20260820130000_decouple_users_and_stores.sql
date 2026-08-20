-- Migration: Full sync of all fields from auth.users to public.users & Decouple stores
-- Description: Creates / alters public.users ensuring all columns exist before syncing from auth.users

DO $$
BEGIN
    -- 1. Create public.users table if not exists
    CREATE TABLE IF NOT EXISTS public.users (
        id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        email text UNIQUE NOT NULL,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
    );

    -- 1.1 Ensure all comprehensive columns exist on public.users (in case users table already existed before)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'phone') THEN
        ALTER TABLE public.users ADD COLUMN phone text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'full_name') THEN
        ALTER TABLE public.users ADD COLUMN full_name text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'avatar_url') THEN
        ALTER TABLE public.users ADD COLUMN avatar_url text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'provider') THEN
        ALTER TABLE public.users ADD COLUMN provider text DEFAULT 'email';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'raw_user_meta_data') THEN
        ALTER TABLE public.users ADD COLUMN raw_user_meta_data jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'raw_app_meta_data') THEN
        ALTER TABLE public.users ADD COLUMN raw_app_meta_data jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'email_confirmed_at') THEN
        ALTER TABLE public.users ADD COLUMN email_confirmed_at timestamptz;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'phone_confirmed_at') THEN
        ALTER TABLE public.users ADD COLUMN phone_confirmed_at timestamptz;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'last_sign_in_at') THEN
        ALTER TABLE public.users ADD COLUMN last_sign_in_at timestamptz;
    END IF;

    -- Enable RLS on users
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
    CREATE POLICY "Users can read own profile" ON public.users FOR SELECT USING (auth.uid() = id);
    DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
    CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

    -- Copy ALL existing users and attributes from auth.users into public.users
    INSERT INTO public.users (
        id, 
        email, 
        phone,
        full_name, 
        avatar_url, 
        provider,
        raw_user_meta_data,
        raw_app_meta_data,
        email_confirmed_at,
        phone_confirmed_at,
        last_sign_in_at,
        created_at, 
        updated_at
    )
    SELECT 
        id, 
        email, 
        phone,
        COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1)),
        raw_user_meta_data->>'avatar_url',
        COALESCE(raw_app_meta_data->>'provider', 'email'),
        raw_user_meta_data,
        raw_app_meta_data,
        email_confirmed_at,
        phone_confirmed_at,
        last_sign_in_at,
        created_at,
        COALESCE(updated_at, created_at)
    FROM auth.users
    ON CONFLICT (id) DO UPDATE 
    SET email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url,
        provider = EXCLUDED.provider,
        raw_user_meta_data = EXCLUDED.raw_user_meta_data,
        raw_app_meta_data = EXCLUDED.raw_app_meta_data,
        email_confirmed_at = EXCLUDED.email_confirmed_at,
        phone_confirmed_at = EXCLUDED.phone_confirmed_at,
        last_sign_in_at = EXCLUDED.last_sign_in_at,
        updated_at = now();

    -- 2. Modify stores table to have independent UUID and owner_id
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'stores'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'stores' AND column_name = 'owner_id'
        ) THEN
            ALTER TABLE public.stores ADD COLUMN owner_id uuid REFERENCES public.users(id) ON DELETE CASCADE;
        END IF;

        UPDATE public.stores SET owner_id = id WHERE owner_id IS NULL;

        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'stores' AND column_name = 'email'
        ) THEN
            ALTER TABLE public.stores DROP COLUMN email;
        END IF;

        ALTER TABLE public.stores ALTER COLUMN id SET DEFAULT gen_random_uuid();
    ELSE
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
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'branchs' AND column_name = 'store_id'
        ) THEN
            ALTER TABLE public.branchs ADD COLUMN store_id uuid;
        END IF;
    END IF;

END $$;

-- 4. Create / Update trigger to auto-sync ALL fields from auth.users into public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.users (
        id, 
        email, 
        phone,
        full_name, 
        avatar_url, 
        provider,
        raw_user_meta_data,
        raw_app_meta_data,
        email_confirmed_at,
        phone_confirmed_at,
        last_sign_in_at,
        created_at, 
        updated_at
    )
    VALUES (
        new.id,
        new.email,
        new.phone,
        COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
        new.raw_user_meta_data->>'avatar_url',
        COALESCE(new.raw_app_meta_data->>'provider', 'email'),
        new.raw_user_meta_data,
        new.raw_app_meta_data,
        new.email_confirmed_at,
        new.phone_confirmed_at,
        new.last_sign_in_at,
        now(),
        now()
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url,
        provider = EXCLUDED.provider,
        raw_user_meta_data = EXCLUDED.raw_user_meta_data,
        raw_app_meta_data = EXCLUDED.raw_app_meta_data,
        email_confirmed_at = EXCLUDED.email_confirmed_at,
        phone_confirmed_at = EXCLUDED.phone_confirmed_at,
        last_sign_in_at = EXCLUDED.last_sign_in_at,
        updated_at = now();
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Safely drop existing trigger before recreating
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    END IF;
END $$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
