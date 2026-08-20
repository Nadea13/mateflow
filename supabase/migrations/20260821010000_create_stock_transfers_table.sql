-- Migration: Create stock_transfers and stock_transfer_items tables
-- Description: Enables inter-branch stock movements with approval workflows and audit trail

DO $$
BEGIN
    -- 1. Create stock_transfers table
    CREATE TABLE IF NOT EXISTS public.stock_transfers (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
        transfer_number text NOT NULL,
        from_branch_id uuid REFERENCES public.branchs(id) ON DELETE CASCADE NOT NULL,
        to_branch_id uuid REFERENCES public.branchs(id) ON DELETE CASCADE NOT NULL,
        status text NOT NULL DEFAULT 'completed', -- 'pending', 'in_transit', 'completed', 'cancelled'
        notes text,
        created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
    );

    -- 2. Create stock_transfer_items table
    CREATE TABLE IF NOT EXISTS public.stock_transfer_items (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        transfer_id uuid REFERENCES public.stock_transfers(id) ON DELETE CASCADE NOT NULL,
        product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
        quantity integer NOT NULL CHECK (quantity > 0),
        created_at timestamptz DEFAULT now()
    );

    -- 3. Enable RLS
    ALTER TABLE public.stock_transfers ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.stock_transfer_items ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Allow authenticated to manage stock_transfers" ON public.stock_transfers;
    CREATE POLICY "Allow authenticated to manage stock_transfers" ON public.stock_transfers FOR ALL TO authenticated USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow authenticated to manage stock_transfer_items" ON public.stock_transfer_items;
    CREATE POLICY "Allow authenticated to manage stock_transfer_items" ON public.stock_transfer_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

END $$;
