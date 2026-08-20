-- Migration: Migrate all business tables from user_id to store_id (FK to public.stores.id)
-- 1. branchs
-- ALTER TABLE public.branchs ADD CONSTRAINT fk_branchs_store_id FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;

-- 2. products
ALTER TABLE public.products ADD CONSTRAINT fk_products_store_id FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;

-- 3. customers
ALTER TABLE public.customers ADD CONSTRAINT fk_customers_store_id FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;

-- 4. bills
ALTER TABLE public.bills ADD CONSTRAINT fk_bills_store_id FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;

-- 5. expenses
ALTER TABLE public.expenses ADD CONSTRAINT fk_expenses_store_id FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;

-- 6. suppliers
ALTER TABLE public.suppliers ADD CONSTRAINT fk_suppliers_store_id FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;

-- 7. purchase_orders
ALTER TABLE public.purchase_orders ADD CONSTRAINT fk_purchase_orders_store_id FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;

-- 8. subscriptions & logs
ALTER TABLE public.subscriptions ADD CONSTRAINT fk_subscriptions_store_id FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;
ALTER TABLE public.subscription_logs ADD CONSTRAINT fk_subscription_logs_store_id FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;

-- 9. inventory_levels -> branchs
ALTER TABLE public.inventory_levels ADD CONSTRAINT fk_inventory_levels_location_id FOREIGN KEY (location_id) REFERENCES public.branchs(id) ON DELETE CASCADE;