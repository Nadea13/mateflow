-- Migration: Clean slate / Truncate all data in public schema and delete all users from auth.users
-- WARNING: This will completely wipe all user accounts, stores, products, bills, stock, etc.

DO $$
BEGIN
    -- 1. Truncate all public application tables with CASCADE
    EXECUTE 'TRUNCATE TABLE 
        public.stock_transfer_items,
        public.stock_transfers,
        public.bill_items,
        public.bills,
        public.expenses,
        public.inventory_levels,
        public.products,
        public.purchase_orders,
        public.suppliers,
        public.customers,
        public.store_team_members,
        public.branchs,
        public.stores,
        public.users
    CASCADE';

EXCEPTION WHEN OTHERS THEN
    -- Fallback: delete rows individually if any table does not exist or has complex constraints
    BEGIN DELETE FROM public.stock_transfer_items; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.stock_transfers; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.bill_items; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.bills; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.expenses; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.inventory_levels; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.products; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.purchase_orders; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.suppliers; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.customers; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.store_team_members; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.branchs; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.stores; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.users; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

-- 2. Delete all users from Supabase Auth schema (auth.users)
-- Note: Deleting from auth.users will automatically clean up auth.identities and auth.sessions
DELETE FROM auth.users;
