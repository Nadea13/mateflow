-- 1. Create stock_transfers & stock_transfer_items
CREATE TABLE IF NOT EXISTS public.stock_transfers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    transfer_number text NOT NULL,
    from_branch_id uuid REFERENCES public.branchs(id) ON DELETE CASCADE NOT NULL,
    to_branch_id uuid REFERENCES public.branchs(id) ON DELETE CASCADE NOT NULL,
    status text NOT NULL DEFAULT 'completed',
    notes text,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.stock_transfer_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id uuid REFERENCES public.stock_transfers(id) ON DELETE CASCADE NOT NULL,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    quantity integer NOT NULL CHECK (quantity > 0),
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transfer_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated to manage stock_transfers" ON public.stock_transfers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated to manage stock_transfer_items" ON public.stock_transfer_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. Create store_team_members
CREATE TABLE IF NOT EXISTS public.store_team_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    role text NOT NULL DEFAULT 'sales',
    assigned_branch_id uuid REFERENCES public.branchs(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(store_id, user_id)
);

ALTER TABLE public.store_team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated to manage store_team_members" ON public.store_team_members FOR ALL TO authenticated USING (true) WITH CHECK (true);