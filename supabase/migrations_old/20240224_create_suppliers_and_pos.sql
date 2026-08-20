-- Create suppliers table
create table public.suppliers (
  id uuid not null default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  email text,
  phone text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (id)
);

-- Create purchase_orders table
create table public.purchase_orders (
  id uuid not null default gen_random_uuid(),
  user_id uuid references auth.users not null,
  supplier_id uuid references public.suppliers not null,
  po_number text not null,
  total_amount decimal(10,2) not null,
  status text not null default 'draft', -- draft, sent, received, cancelled
  note text,
  date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (id)
);

-- Create po_items table
create table public.po_items (
  id uuid not null default gen_random_uuid(),
  po_id uuid references public.purchase_orders on delete cascade not null,
  name text not null,
  quantity decimal(10,2) not null,
  unit_price decimal(10,2) not null,
  total_price decimal(10,2) not null,
  created_at timestamptz not null default now(),
  primary key (id)
);

-- Enable RLS
alter table public.suppliers enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.po_items enable row level security;

-- Suppliers policies
create policy "Users can view their own suppliers"
  on public.suppliers for select using (auth.uid() = user_id);

create policy "Users can insert their own suppliers"
  on public.suppliers for insert with check (auth.uid() = user_id);

create policy "Users can update their own suppliers"
  on public.suppliers for update using (auth.uid() = user_id);

create policy "Users can delete their own suppliers"
  on public.suppliers for delete using (auth.uid() = user_id);

-- Purchase Orders policies
create policy "Users can view their own purchase_orders"
  on public.purchase_orders for select using (auth.uid() = user_id);

create policy "Users can insert their own purchase_orders"
  on public.purchase_orders for insert with check (auth.uid() = user_id);

create policy "Users can update their own purchase_orders"
  on public.purchase_orders for update using (auth.uid() = user_id);

create policy "Users can delete their own purchase_orders"
  on public.purchase_orders for delete using (auth.uid() = user_id);

-- PO Items policies
create policy "Users can view their own po_items"
  on public.po_items for select using (
    exists (
      select 1 from public.purchase_orders
      where id = po_id and user_id = auth.uid()
    )
  );

create policy "Users can insert their own po_items"
  on public.po_items for insert with check (
    exists (
      select 1 from public.purchase_orders
      where id = po_id and user_id = auth.uid()
    )
  );

create policy "Users can update their own po_items"
  on public.po_items for update using (
    exists (
      select 1 from public.purchase_orders
      where id = po_id and user_id = auth.uid()
    )
  );

create policy "Users can delete their own po_items"
  on public.po_items for delete using (
    exists (
      select 1 from public.purchase_orders
      where id = po_id and user_id = auth.uid()
    )
  );
