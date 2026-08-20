-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text,
    store_name text DEFAULT 'My Mateflow Store',
    avatar_url text,
    owner_id uuid,
    role text DEFAULT 'owner',
    default_currency text DEFAULT 'USD',
    country text DEFAULT 'US',
    tax_rate numeric DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    sku text,
    barcode text,
    price numeric NOT NULL DEFAULT 0,
    cost_price numeric DEFAULT 0,
    stock integer NOT NULL DEFAULT 0,
    min_stock_level integer DEFAULT 0,
    image_url text,
    supplier_id uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    address text,
    line_id text,
    country text,
    tax_id text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 4. Bills Table
CREATE TABLE IF NOT EXISTS public.bills (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
    total_amount numeric NOT NULL DEFAULT 0,
    currency text DEFAULT 'USD',
    status text DEFAULT 'draft' CHECK (status IN ('draft', 'paid', 'cancelled')),
    note text,
    adjustments jsonb DEFAULT '[]'::jsonb,
    payment_terms integer DEFAULT 0,
    validity_days integer DEFAULT 7,
    created_at timestamptz DEFAULT now()
);

-- 5. Bill Items Table
CREATE TABLE IF NOT EXISTS public.bill_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id uuid REFERENCES public.bills(id) ON DELETE CASCADE NOT NULL,
    product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
    product_name text NOT NULL,
    sku text,
    quantity numeric NOT NULL DEFAULT 1,
    unit_price numeric NOT NULL DEFAULT 0,
    total_price numeric NOT NULL DEFAULT 0
);

-- 6. Suppliers Table
CREATE TABLE IF NOT EXISTS public.suppliers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    address text,
    country text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 7. Purchase Orders
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
    po_number text NOT NULL,
    total_amount numeric NOT NULL DEFAULT 0,
    currency text DEFAULT 'USD',
    status text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'received', 'cancelled')),
    note text,
    date date DEFAULT CURRENT_DATE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 8. Locations / Warehouses
CREATE TABLE IF NOT EXISTS public.locations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    code text,
    type text DEFAULT 'warehouse',
    country text DEFAULT 'US',
    address text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 9. Expenses Table
CREATE TABLE IF NOT EXISTS public.expenses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    amount numeric NOT NULL DEFAULT 0,
    currency text DEFAULT 'USD',
    category text DEFAULT 'General',
    description text,
    date date DEFAULT CURRENT_DATE,
    receipt_url text,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Base RLS Policies
CREATE POLICY "Users can manage their own profiles" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can manage their own products" ON public.products FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own customers" ON public.customers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own bills" ON public.bills FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own bill items" ON public.bill_items FOR ALL USING (true);
CREATE POLICY "Users can manage their own suppliers" ON public.suppliers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own purchase orders" ON public.purchase_orders FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own locations" ON public.locations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own expenses" ON public.expenses FOR ALL USING (auth.uid() = user_id);
