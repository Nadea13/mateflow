-- Migration: Enforce strict multi-store data isolation and store-level RLS policies
-- Description: Ensures users only view, insert, update, and delete records belonging to stores they own or have staff access to.

DO $$
BEGIN
    -- 1. STORES TABLE RLS
    ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.stores;
    DROP POLICY IF EXISTS "Allow authenticated to manage stores" ON public.stores;
    DROP POLICY IF EXISTS "Stores are manageable by owner or team" ON public.stores;

    CREATE POLICY "Stores are manageable by owner or team" 
    ON public.stores 
    FOR ALL 
    TO authenticated 
    USING (
        owner_id = auth.uid() 
        OR id IN (SELECT store_id FROM public.store_team_members WHERE user_id = auth.uid())
    )
    WITH CHECK (
        owner_id = auth.uid()
    );

    -- 2. BRANCHS TABLE RLS
    ALTER TABLE public.branchs ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.branchs;
    DROP POLICY IF EXISTS "Allow authenticated to manage branchs" ON public.branchs;
    DROP POLICY IF EXISTS "Branchs strictly isolated by store ownership" ON public.branchs;

    CREATE POLICY "Branchs strictly isolated by store ownership" 
    ON public.branchs 
    FOR ALL 
    TO authenticated 
    USING (
        store_id IN (
            SELECT id FROM public.stores WHERE owner_id = auth.uid()
            UNION
            SELECT store_id FROM public.store_team_members WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        store_id IN (
            SELECT id FROM public.stores WHERE owner_id = auth.uid()
            UNION
            SELECT store_id FROM public.store_team_members WHERE user_id = auth.uid()
        )
    );

    -- 3. PRODUCTS TABLE RLS
    ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow authenticated users to manage products" ON public.products;
    DROP POLICY IF EXISTS "Products strictly isolated by store ownership" ON public.products;

    CREATE POLICY "Products strictly isolated by store ownership" 
    ON public.products 
    FOR ALL 
    TO authenticated 
    USING (
        store_id IN (
            SELECT id FROM public.stores WHERE owner_id = auth.uid()
            UNION
            SELECT store_id FROM public.store_team_members WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        store_id IN (
            SELECT id FROM public.stores WHERE owner_id = auth.uid()
            UNION
            SELECT store_id FROM public.store_team_members WHERE user_id = auth.uid()
        )
    );

    -- 4. INVENTORY LEVELS TABLE RLS
    ALTER TABLE public.inventory_levels ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow authenticated users to manage inventory levels" ON public.inventory_levels;
    DROP POLICY IF EXISTS "Inventory levels strictly isolated by store ownership" ON public.inventory_levels;

    CREATE POLICY "Inventory levels strictly isolated by store ownership" 
    ON public.inventory_levels 
    FOR ALL 
    TO authenticated 
    USING (
        store_id IN (
            SELECT id FROM public.stores WHERE owner_id = auth.uid()
            UNION
            SELECT store_id FROM public.store_team_members WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        store_id IN (
            SELECT id FROM public.stores WHERE owner_id = auth.uid()
            UNION
            SELECT store_id FROM public.store_team_members WHERE user_id = auth.uid()
        )
    );

    -- 5. BILLS TABLE RLS
    ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow authenticated users to manage bills" ON public.bills;
    DROP POLICY IF EXISTS "Bills strictly isolated by store ownership" ON public.bills;

    CREATE POLICY "Bills strictly isolated by store ownership" 
    ON public.bills 
    FOR ALL 
    TO authenticated 
    USING (
        store_id IN (
            SELECT id FROM public.stores WHERE owner_id = auth.uid()
            UNION
            SELECT store_id FROM public.store_team_members WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        store_id IN (
            SELECT id FROM public.stores WHERE owner_id = auth.uid()
            UNION
            SELECT store_id FROM public.store_team_members WHERE user_id = auth.uid()
        )
    );

    -- 6. CUSTOMERS TABLE RLS
    ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow authenticated users to manage customers" ON public.customers;
    DROP POLICY IF EXISTS "Customers strictly isolated by store ownership" ON public.customers;

    CREATE POLICY "Customers strictly isolated by store ownership" 
    ON public.customers 
    FOR ALL 
    TO authenticated 
    USING (
        store_id IN (
            SELECT id FROM public.stores WHERE owner_id = auth.uid()
            UNION
            SELECT store_id FROM public.store_team_members WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        store_id IN (
            SELECT id FROM public.stores WHERE owner_id = auth.uid()
            UNION
            SELECT store_id FROM public.store_team_members WHERE user_id = auth.uid()
        )
    );

    -- 7. EXPENSES TABLE RLS
    ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow authenticated users to manage expenses" ON public.expenses;
    DROP POLICY IF EXISTS "Expenses strictly isolated by store ownership" ON public.expenses;

    CREATE POLICY "Expenses strictly isolated by store ownership" 
    ON public.expenses 
    FOR ALL 
    TO authenticated 
    USING (
        store_id IN (
            SELECT id FROM public.stores WHERE owner_id = auth.uid()
            UNION
            SELECT store_id FROM public.store_team_members WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        store_id IN (
            SELECT id FROM public.stores WHERE owner_id = auth.uid()
            UNION
            SELECT store_id FROM public.store_team_members WHERE user_id = auth.uid()
        )
    );

    -- 8. PURCHASE ORDERS & SUPPLIERS RLS
    ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow authenticated users to manage purchase orders" ON public.purchase_orders;
    DROP POLICY IF EXISTS "PO strictly isolated by store ownership" ON public.purchase_orders;

    CREATE POLICY "PO strictly isolated by store ownership" 
    ON public.purchase_orders 
    FOR ALL 
    TO authenticated 
    USING (
        store_id IN (
            SELECT id FROM public.stores WHERE owner_id = auth.uid()
            UNION
            SELECT store_id FROM public.store_team_members WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        store_id IN (
            SELECT id FROM public.stores WHERE owner_id = auth.uid()
            UNION
            SELECT store_id FROM public.store_team_members WHERE user_id = auth.uid()
        )
    );

    ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow authenticated users to manage suppliers" ON public.suppliers;
    DROP POLICY IF EXISTS "Suppliers strictly isolated by store ownership" ON public.suppliers;

    CREATE POLICY "Suppliers strictly isolated by store ownership" 
    ON public.suppliers 
    FOR ALL 
    TO authenticated 
    USING (
        store_id IN (
            SELECT id FROM public.stores WHERE owner_id = auth.uid()
            UNION
            SELECT store_id FROM public.store_team_members WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        store_id IN (
            SELECT id FROM public.stores WHERE owner_id = auth.uid()
            UNION
            SELECT store_id FROM public.store_team_members WHERE user_id = auth.uid()
        )
    );

END $$;
