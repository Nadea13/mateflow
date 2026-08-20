-- Enable standard PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create auth schema mock for local development if not using complete Supabase Docker
CREATE SCHEMA IF NOT EXISTS auth;

CREATE OR REPLACE FUNCTION auth.uid() 
RETURNS uuid 
LANGUAGE sql STABLE AS $$
    SELECT '00000000-0000-0000-0000-000000000000'::uuid;
$$;

-- Create core tables
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE TABLE IF NOT EXISTS public.products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
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

CREATE TABLE IF NOT EXISTS public.customers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
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

CREATE TABLE IF NOT EXISTS public.bills (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
    customer_id uuid,
    total_amount numeric NOT NULL DEFAULT 0,
    currency text DEFAULT 'USD',
    status text DEFAULT 'draft',
    note text,
    adjustments jsonb DEFAULT '[]'::jsonb,
    payment_terms integer DEFAULT 0,
    validity_days integer DEFAULT 7,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bill_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id uuid REFERENCES public.bills(id) ON DELETE CASCADE,
    product_id uuid,
    product_name text NOT NULL,
    sku text,
    quantity numeric NOT NULL DEFAULT 1,
    unit_price numeric NOT NULL DEFAULT 0,
    total_price numeric NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.locations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
    name text NOT NULL,
    code text,
    type text DEFAULT 'warehouse',
    country text DEFAULT 'US',
    address text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.suppliers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
    name text NOT NULL,
    email text,
    phone text,
    address text,
    country text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.expenses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
    title text NOT NULL,
    amount numeric NOT NULL DEFAULT 0,
    currency text DEFAULT 'USD',
    category text DEFAULT 'General',
    description text,
    date date DEFAULT CURRENT_DATE,
    receipt_url text,
    created_at timestamptz DEFAULT now()
);
