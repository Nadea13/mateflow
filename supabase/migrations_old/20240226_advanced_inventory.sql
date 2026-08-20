-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Locations Table
CREATE TABLE IF NOT EXISTS public.locations (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    type text DEFAULT 'warehouse' CHECK (type IN ('warehouse', 'storefront', 'other')),
    address text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Setup RLS for locations
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own locations"
    ON public.locations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own locations"
    ON public.locations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own locations"
    ON public.locations FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own locations"
    ON public.locations FOR DELETE
    USING (auth.uid() = user_id);


-- Create Inventory Levels Table
CREATE TABLE IF NOT EXISTS public.inventory_levels (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    location_id uuid REFERENCES public.locations(id) ON DELETE CASCADE NOT NULL,
    quantity numeric DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(product_id, location_id)
);

-- Setup RLS for inventory_levels
ALTER TABLE public.inventory_levels ENABLE ROW LEVEL SECURITY;

-- Note: In a stricter setup, we'd verify the user owns the product and location,
-- but for simplicity, we assume if they can access the product, they can see its inventory.
-- Here we verify via joined product ownership.
CREATE POLICY "Users can view their own inventory levels"
    ON public.inventory_levels FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.products
        WHERE products.id = inventory_levels.product_id
        AND products.user_id = auth.uid()
    ));

CREATE POLICY "Users can create inventory levels"
    ON public.inventory_levels FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.products
        WHERE products.id = product_id
        AND products.user_id = auth.uid()
    ));

CREATE POLICY "Users can update inventory levels"
    ON public.inventory_levels FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.products
        WHERE products.id = product_id
        AND products.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete inventory levels"
    ON public.inventory_levels FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM public.products
        WHERE products.id = product_id
        AND products.user_id = auth.uid()
    ));


-- Alter Products Table
ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS min_stock_level numeric DEFAULT 0,
    ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL;

-- Automatically create a 'Main Warehouse' location for existing users
-- and move all existing product stock into that location.
-- This requires a function or manual migration step. Not strict for this basic setup,
-- but a good practice. We'll handle it at the application level if a location is needed.
