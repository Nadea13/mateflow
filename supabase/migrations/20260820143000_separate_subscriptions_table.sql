-- Migration: Create dedicated public.subscriptions table and clean up profiles

-- 1. Create dedicated Subscriptions Table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    stripe_customer_id text,
    stripe_subscription_id text,
    tier text DEFAULT 'free',                  -- 'free', 'pro', 'scale'
    status text DEFAULT 'active',              -- 'active', 'past_due', 'canceled'
    current_period_start timestamptz DEFAULT now(),
    current_period_end timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Migrate any existing data from profiles to subscriptions
INSERT INTO public.subscriptions (user_id, stripe_customer_id, stripe_subscription_id, tier, status, current_period_end)
SELECT 
    p.id as user_id, 
    p.stripe_customer_id, 
    p.stripe_subscription_id, 
    COALESCE(p.subscription_tier, 'free') as tier, 
    COALESCE(p.subscription_status, 'active') as status, 
    p.current_period_end
FROM public.profiles p
ON CONFLICT (user_id) DO UPDATE SET
    stripe_customer_id = EXCLUDED.stripe_customer_id,
    stripe_subscription_id = EXCLUDED.stripe_subscription_id,
    tier = EXCLUDED.tier,
    status = EXCLUDED.status,
    current_period_end = EXCLUDED.current_period_end;

-- 3. Clean up Stripe columns from public.profiles
ALTER TABLE public.profiles 
  DROP COLUMN IF EXISTS stripe_customer_id,
  DROP COLUMN IF EXISTS stripe_subscription_id,
  DROP COLUMN IF EXISTS subscription_tier,
  DROP COLUMN IF EXISTS subscription_status,
  DROP COLUMN IF EXISTS current_period_end;

-- 4. Enable RLS on public.subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view and manage their own subscription" ON public.subscriptions;
CREATE POLICY "Users can view and manage their own subscription" 
  ON public.subscriptions 
  FOR ALL 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- 5. Grant Permissions
GRANT ALL ON TABLE public.subscriptions TO postgres, anon, authenticated, service_role;
