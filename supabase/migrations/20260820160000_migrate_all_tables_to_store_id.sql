-- Migration: Migrate all business domain tables from user_id to store_id (FK to public.stores.id)
-- Tables: branchs, bills, customers, expenses, inventory_levels, products, purchase_orders, subscriptions, subscription_logs, suppliers

DO $$
BEGIN
    ---------------------------------------------------------------------------
    -- 1. BRANCHS (Ensure store_id FK to stores.id)
    ---------------------------------------------------------------------------
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'branchs') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'branchs' AND column_name = 'store_id') THEN
            ALTER TABLE public.branchs ADD COLUMN store_id uuid;
        END IF;

        -- Fallback map user_id to stores.id where store_id is null
        UPDATE public.branchs b
        SET store_id = s.id
        FROM public.stores s
        WHERE b.store_id IS NULL AND (b.user_id = s.owner_id OR b.user_id = s.id);

        -- Add FK constraint
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_branchs_store_id') THEN
            ALTER TABLE public.branchs ADD CONSTRAINT fk_branchs_store_id FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;
        END IF;
    END IF;

    ---------------------------------------------------------------------------
    -- 2. PRODUCTS (user_id -> store_id)
    ---------------------------------------------------------------------------
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'store_id') THEN
            ALTER TABLE public.products ADD COLUMN store_id uuid;
        END IF;

        UPDATE public.products p
        SET store_id = s.id
        FROM public.stores s
        WHERE p.store_id IS NULL AND (p.user_id = s.owner_id OR p.user_id = s.id);

        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_products_store_id') THEN
            ALTER TABLE public.products ADD CONSTRAINT fk_products_store_id FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;
        END IF;
    END IF;

    ---------------------------------------------------------------------------
    -- 3. CUSTOMERS (user_id -> store_id)
    ---------------------------------------------------------------------------
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'store_id') THEN
            ALTER TABLE public.customers ADD COLUMN store_id uuid;
        END IF;

        UPDATE public.customers c
        SET store_id = s.id
        FROM public.stores s
        WHERE c.store_id IS NULL AND (c.user_id = s.owner_id OR c.user_id = s.id);

        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_customers_store_id') THEN
            ALTER TABLE public.customers ADD CONSTRAINT fk_customers_store_id FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;
        END IF;
    END IF;

    ---------------------------------------------------------------------------
    -- 4. BILLS (user_id -> store_id)
    ---------------------------------------------------------------------------
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bills') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bills' AND column_name = 'store_id') THEN
            ALTER TABLE public.bills ADD COLUMN store_id uuid;
        END IF;

        UPDATE public.bills b
        SET store_id = s.id
        FROM public.stores s
        WHERE b.store_id IS NULL AND (b.user_id = s.owner_id OR b.user_id = s.id);

        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_bills_store_id') THEN
            ALTER TABLE public.bills ADD CONSTRAINT fk_bills_store_id FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;
        END IF;
    END IF;

    ---------------------------------------------------------------------------
    -- 5. EXPENSES (user_id -> store_id)
    ---------------------------------------------------------------------------
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expenses') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'expenses' AND column_name = 'store_id') THEN
            ALTER TABLE public.expenses ADD COLUMN store_id uuid;
        END IF;

        UPDATE public.expenses e
        SET store_id = s.id
        FROM public.stores s
        WHERE e.store_id IS NULL AND (e.user_id = s.owner_id OR e.user_id = s.id);

        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_expenses_store_id') THEN
            ALTER TABLE public.expenses ADD CONSTRAINT fk_expenses_store_id FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;
        END IF;
    END IF;

    ---------------------------------------------------------------------------
    -- 6. SUPPLIERS (user_id -> store_id)
    ---------------------------------------------------------------------------
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'suppliers') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'suppliers' AND column_name = 'store_id') THEN
            ALTER TABLE public.suppliers ADD COLUMN store_id uuid;
        END IF;

        UPDATE public.suppliers sp
        SET store_id = s.id
        FROM public.stores s
        WHERE sp.store_id IS NULL AND (sp.user_id = s.owner_id OR sp.user_id = s.id);

        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_suppliers_store_id') THEN
            ALTER TABLE public.suppliers ADD CONSTRAINT fk_suppliers_store_id FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;
        END IF;
    END IF;

    ---------------------------------------------------------------------------
    -- 7. PURCHASE ORDERS (user_id -> store_id)
    ---------------------------------------------------------------------------
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'purchase_orders') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'purchase_orders' AND column_name = 'store_id') THEN
            ALTER TABLE public.purchase_orders ADD COLUMN store_id uuid;
        END IF;

        UPDATE public.purchase_orders po
        SET store_id = s.id
        FROM public.stores s
        WHERE po.store_id IS NULL AND (po.user_id = s.owner_id OR po.user_id = s.id);

        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_purchase_orders_store_id') THEN
            ALTER TABLE public.purchase_orders ADD CONSTRAINT fk_purchase_orders_store_id FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;
        END IF;
    END IF;

    ---------------------------------------------------------------------------
    -- 8. SUBSCRIPTIONS (user_id -> store_id)
    ---------------------------------------------------------------------------
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscriptions') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'store_id') THEN
            ALTER TABLE public.subscriptions ADD COLUMN store_id uuid;
        END IF;

        UPDATE public.subscriptions sub
        SET store_id = s.id
        FROM public.stores s
        WHERE sub.store_id IS NULL AND (sub.user_id = s.owner_id OR sub.user_id = s.id);

        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_subscriptions_store_id') THEN
            ALTER TABLE public.subscriptions ADD CONSTRAINT fk_subscriptions_store_id FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;
        END IF;
    END IF;

    ---------------------------------------------------------------------------
    -- 9. SUBSCRIPTION LOGS (subscription_logs: user_id -> store_id)
    ---------------------------------------------------------------------------
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscription_logs') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'subscription_logs' AND column_name = 'store_id') THEN
            ALTER TABLE public.subscription_logs ADD COLUMN store_id uuid;
        END IF;

        UPDATE public.subscription_logs slog
        SET store_id = s.id
        FROM public.stores s
        WHERE slog.store_id IS NULL AND (slog.user_id = s.owner_id OR slog.user_id = s.id);

        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_subscription_logs_store_id') THEN
            ALTER TABLE public.subscription_logs ADD CONSTRAINT fk_subscription_logs_store_id FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;
        END IF;
    END IF;

    ---------------------------------------------------------------------------
    -- 10. INVENTORY LEVELS (ensure location_id references branchs.id)
    ---------------------------------------------------------------------------
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_levels') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_inventory_levels_location_id') THEN
            ALTER TABLE public.inventory_levels DROP CONSTRAINT IF EXISTS inventory_levels_location_id_fkey;
            ALTER TABLE public.inventory_levels ADD CONSTRAINT fk_inventory_levels_location_id FOREIGN KEY (location_id) REFERENCES public.branchs(id) ON DELETE CASCADE;
        END IF;
    END IF;

END $$;
