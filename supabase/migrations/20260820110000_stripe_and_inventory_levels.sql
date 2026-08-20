-- Migration: Add Stripe subscription columns, logs, inventory_levels table, and team member RPC

-- 1. Profiles Table Extension for Stripe Subscriptions
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz;

-- 2. Inventory Levels Table (Per-Location Stock Tracking)
CREATE TABLE IF NOT EXISTS public.inventory_levels (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    location_id uuid REFERENCES public.locations(id) ON DELETE CASCADE NOT NULL,
    quantity integer NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(product_id, location_id)
);

ALTER TABLE public.inventory_levels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage inventory levels" ON public.inventory_levels;
CREATE POLICY "Users can manage inventory levels" ON public.inventory_levels FOR ALL USING (true) WITH CHECK (true);

-- 3. Subscription Logs Table
CREATE TABLE IF NOT EXISTS public.subscription_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_event_id text UNIQUE,
    event_type text NOT NULL,
    amount_paid numeric,
    currency text DEFAULT 'thb',
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.subscription_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own subscription logs" ON public.subscription_logs;
CREATE POLICY "Users can view own subscription logs" ON public.subscription_logs 
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. Get Team Members Function
DROP FUNCTION IF EXISTS public.get_team_members();
CREATE OR REPLACE FUNCTION public.get_team_members()
RETURNS TABLE (
    id uuid,
    email text,
    role text,
    created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        p.id,
        p.email,
        p.role,
        p.created_at
    FROM public.profiles p
    WHERE p.owner_id = auth.uid() OR p.id = auth.uid();
$$;

-- 5. Ensure Proper Grants
GRANT ALL ON TABLE public.profiles TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.products TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.customers TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.bills TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.bill_items TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.suppliers TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.purchase_orders TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.locations TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.expenses TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.inventory_levels TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.subscription_logs TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_team_members() TO authenticated, anon, service_role;
