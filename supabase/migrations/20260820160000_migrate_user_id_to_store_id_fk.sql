-- Migration: Migrate tables from user_id FK to store_id FK referencing public.stores(id)
-- Tables affected: bills, customers, expenses, inventory_levels, products, purchase_orders, subscriptions, subscription_logs, suppliers

DO $$
DECLARE
    rec RECORD;
BEGIN
    -- 1. Helper function to rename or add store_id column and setup FK to stores(id)
    -- List of tables to migrate:
    -- bills, customers, expenses, products, purchase_orders, subscriptions, subscription_logs, suppliers
    
    -- TABLE: bills
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bills') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bills' AND column_name = 'user_id') 
           AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bills' AND column_name = 'store_id') THEN
            ALTER TABLE public.bills RENAME COLUMN user_id TO store_id;
        ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bills' AND column_name = 'store_id') THEN
            ALTER TABLE public.bills ADD COLUMN store_id uuid;
        END IF;

        ALTER TABLE public.bills DROP CONSTRAINT IF EXISTS bills_user_id_fkey;
        ALTER TABLE public.bills DROP CONSTRAINT IF EXISTS fk_bills_store_id;
        ALTER TABLE public.bills ADD CONSTRAINT fk_bills_store_id FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;
    END IF;

    -- TABLE: customers
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'user_id') 
           AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'store_id') THEN
            ALTER TABLE public.customers RENAME COLUMN user_id TO store_id;
        ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'store_id') THEN
            ALTER TABLE public.customers ADD COLUMN store_id uuid;
        END IF;

        ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_user_id_fkey;
        ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS fk_customers_store_id;
        ALTER TABLE public.customers ADD CONSTRAINT fk_customers_store_id FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;
    END IF;

    -- TABLE: expenses
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expenses') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'expenses' AND column_name = 'user_id') 
           AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'expenses' AND column_name = 'store_id') THEN
            ALTER TABLE public.expenses RENAME COLUMN user_id TO store_id;
        ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'expenses' AND column_name = 'store_id') THEN
            ALTER TABLE public.expenses ADD COLUMN store_id uuid;
        END IF;

        ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_user_id_fkey;
        ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS fk_expenses_store_id;
        ALTER TABLE public.expenses ADD CONSTRAINT fk_expenses_store_id FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;
    END IF;

    -- TABLE: products
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'user_id') 
           AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'store_id') THEN
            ALTER TABLE public.products RENAME COLUMN user_id TO store_id;
        ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'store_id') THEN
            ALTER TABLE public.products ADD COLUMN store_id uuid;
        END IF;

        ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_user_id_fkey;
        ALTER TABLE public.products DROP CONSTRAINT IF EXISTS fk_products_store_id;
        ALTER TABLE public.products ADD CONSTRAINT fk_products_store_id FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;
    END IF;

    -- TABLE: purchase_orders
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'purchase_orders') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'purchase_orders' AND column_name = 'user_id') 
           AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'purchase_orders' AND column_name = 'store_id') THEN
            ALTER TABLE public.purchase_orders RENAME COLUMN user_id TO store_id;
        ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'purchase_orders' AND column_name = 'store_id') THEN
            ALTER TABLE public.purchase_orders ADD COLUMN store_id uuid;
        END IF;

        ALTER TABLE public.purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_user_id_fkey;
        ALTER TABLE public.purchase_orders DROP CONSTRAINT IF EXISTS fk_purchase_orders_store_id;
        ALTER TABLE public.purchase_orders ADD CONSTRAINT fk_purchase_orders_store_id FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;
    END IF;

    -- TABLE: suppliers
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'suppliers') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'suppliers' AND column_name = 'user_id') 
           AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'suppliers' AND column_name = 'store_id') THEN
            ALTER TABLE public.suppliers RENAME COLUMN user_id TO store_id;
        ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'suppliers' AND column_name = 'store_id') THEN
            ALTER TABLE public.suppliers ADD COLUMN store_id uuid;
        END IF;

        ALTER TABLE public.suppliers DROP CONSTRAINT IF EXISTS suppliers_user_id_fkey;
        ALTER TABLE public.suppliers DROP CONSTRAINT IF EXISTS fk_suppliers_store_id;
        ALTER TABLE public.suppliers ADD CONSTRAINT fk_suppliers_store_id FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;
    END IF;

    -- TABLE: subscriptions
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscriptions') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'user_id') 
           AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'store_id') THEN
            ALTER TABLE public.subscriptions RENAME COLUMN user_id TO store_id;
        ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'store_id') THEN
            ALTER TABLE public.subscriptions ADD COLUMN store_id uuid;
        END IF;

        ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;
        ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS fk_subscriptions_store_id;
        ALTER TABLE public.subscriptions ADD CONSTRAINT fk_subscriptions_store_id FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;
    END IF;

    -- TABLE: subscription_logs (or subscription_log)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscription_logs') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'subscription_logs' AND column_name = 'user_id') 
           AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'subscription_logs' AND column_name = 'store_id') THEN
            ALTER TABLE public.subscription_logs RENAME COLUMN user_id TO store_id;
        ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'subscription_logs' AND column_name = 'store_id') THEN
            ALTER TABLE public.subscription_logs ADD COLUMN store_id uuid;
        END IF;

        ALTER TABLE public.subscription_logs DROP CONSTRAINT IF EXISTS subscription_logs_user_id_fkey;
        ALTER TABLE public.subscription_logs DROP CONSTRAINT IF EXISTS fk_subscription_logs_store_id;
        ALTER TABLE public.subscription_logs ADD CONSTRAINT fk_subscription_logs_store_id FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;
    END IF;

    -- TABLE: inventory_levels (already has location_id referencing branchs, add store_id if needed)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_levels') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_levels' AND column_name = 'store_id') THEN
            ALTER TABLE public.inventory_levels ADD COLUMN store_id uuid;
        END IF;

        ALTER TABLE public.inventory_levels DROP CONSTRAINT IF EXISTS fk_inventory_levels_store_id;
        ALTER TABLE public.inventory_levels ADD CONSTRAINT fk_inventory_levels_store_id FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;
    END IF;

END $$;
