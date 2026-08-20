-- Migration: Update RLS policies for all tables migrated to store_id
-- Tables: products, bills, customers, expenses, purchase_orders, suppliers, branchs, inventory_levels

DO $$
BEGIN
    -- 1. PRODUCTS TABLE RLS
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
        ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
        
        -- Drop old policies that checked auth.uid() = user_id
        DROP POLICY IF EXISTS "Users can manage products" ON public.products;
        DROP POLICY IF EXISTS "Users can view own products" ON public.products;
        DROP POLICY IF EXISTS "Users can insert own products" ON public.products;
        DROP POLICY IF EXISTS "Users can update own products" ON public.products;
        DROP POLICY IF EXISTS "Users can delete own products" ON public.products;
        DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.products;

        CREATE POLICY "Allow authenticated users to manage products" 
        ON public.products 
        FOR ALL 
        TO authenticated 
        USING (true) 
        WITH CHECK (true);
    END IF;

    -- 2. BILLS TABLE RLS
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bills') THEN
        ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Users can manage bills" ON public.bills;
        DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.bills;

        CREATE POLICY "Allow authenticated users to manage bills" 
        ON public.bills 
        FOR ALL 
        TO authenticated 
        USING (true) 
        WITH CHECK (true);
    END IF;

    -- 3. CUSTOMERS TABLE RLS
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
        ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Users can manage customers" ON public.customers;
        DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.customers;

        CREATE POLICY "Allow authenticated users to manage customers" 
        ON public.customers 
        FOR ALL 
        TO authenticated 
        USING (true) 
        WITH CHECK (true);
    END IF;

    -- 4. EXPENSES TABLE RLS
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expenses') THEN
        ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Users can manage expenses" ON public.expenses;
        DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.expenses;

        CREATE POLICY "Allow authenticated users to manage expenses" 
        ON public.expenses 
        FOR ALL 
        TO authenticated 
        USING (true) 
        WITH CHECK (true);
    END IF;

    -- 5. PURCHASE ORDERS TABLE RLS
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'purchase_orders') THEN
        ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Users can manage purchase orders" ON public.purchase_orders;
        DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.purchase_orders;

        CREATE POLICY "Allow authenticated users to manage purchase orders" 
        ON public.purchase_orders 
        FOR ALL 
        TO authenticated 
        USING (true) 
        WITH CHECK (true);
    END IF;

    -- 6. SUPPLIERS TABLE RLS
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'suppliers') THEN
        ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Users can manage suppliers" ON public.suppliers;
        DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.suppliers;

        CREATE POLICY "Allow authenticated users to manage suppliers" 
        ON public.suppliers 
        FOR ALL 
        TO authenticated 
        USING (true) 
        WITH CHECK (true);
    END IF;

    -- 7. INVENTORY LEVELS TABLE RLS
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_levels') THEN
        ALTER TABLE public.inventory_levels ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Users can manage inventory levels" ON public.inventory_levels;
        
        CREATE POLICY "Allow authenticated users to manage inventory levels" 
        ON public.inventory_levels 
        FOR ALL 
        TO authenticated 
        USING (true) 
        WITH CHECK (true);
    END IF;

END $$;
