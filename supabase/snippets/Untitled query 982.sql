DO $$
BEGIN
    -- 1. PRODUCTS
    ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow authenticated users to manage products" ON public.products;
    DROP POLICY IF EXISTS "Products strictly isolated by store ownership" ON public.products;
    CREATE POLICY "Products strictly isolated by store ownership" ON public.products FOR ALL TO authenticated 
    USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid() UNION SELECT store_id FROM public.store_team_members WHERE user_id = auth.uid()))
    WITH CHECK (store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid() UNION SELECT store_id FROM public.store_team_members WHERE user_id = auth.uid()));

    -- 2. INVENTORY LEVELS
    ALTER TABLE public.inventory_levels ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow authenticated users to manage inventory levels" ON public.inventory_levels;
    DROP POLICY IF EXISTS "Inventory levels strictly isolated by store ownership" ON public.inventory_levels;
    CREATE POLICY "Inventory levels strictly isolated by store ownership" ON public.inventory_levels FOR ALL TO authenticated 
    USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid() UNION SELECT store_id FROM public.store_team_members WHERE user_id = auth.uid()))
    WITH CHECK (store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid() UNION SELECT store_id FROM public.store_team_members WHERE user_id = auth.uid()));

    -- 3. BRANCHS
    ALTER TABLE public.branchs ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.branchs;
    DROP POLICY IF EXISTS "Branchs strictly isolated by store ownership" ON public.branchs;
    CREATE POLICY "Branchs strictly isolated by store ownership" ON public.branchs FOR ALL TO authenticated 
    USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid() UNION SELECT store_id FROM public.store_team_members WHERE user_id = auth.uid()))
    WITH CHECK (store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid() UNION SELECT store_id FROM public.store_team_members WHERE user_id = auth.uid()));

    -- 4. BILLS
    ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow authenticated users to manage bills" ON public.bills;
    DROP POLICY IF EXISTS "Bills strictly isolated by store ownership" ON public.bills;
    CREATE POLICY "Bills strictly isolated by store ownership" ON public.bills FOR ALL TO authenticated 
    USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid() UNION SELECT store_id FROM public.store_team_members WHERE user_id = auth.uid()))
    WITH CHECK (store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid() UNION SELECT store_id FROM public.store_team_members WHERE user_id = auth.uid()));
END $$;