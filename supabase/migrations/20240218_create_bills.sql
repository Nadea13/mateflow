-- Create bills table
create table public.bills (
  id uuid not null default gen_random_uuid(),
  user_id uuid references auth.users not null,
  customer_id uuid references public.customers(id),
  total_amount decimal(10,2) not null default 0,
  status text check (status in ('draft', 'paid', 'cancelled')) default 'draft',
  note text,
  created_at timestamptz not null default now(),
  primary key (id)
);

-- Create bill_items table
create table public.bill_items (
  id uuid not null default gen_random_uuid(),
  bill_id uuid references public.bills(id) on delete cascade not null,
  product_id uuid references public.products(id),
  product_name text not null,
  quantity integer not null default 1,
  unit_price decimal(10,2) not null,
  total_price decimal(10,2) not null,
  primary key (id)
);

-- Enable RLS
alter table public.bills enable row level security;
alter table public.bill_items enable row level security;

-- Bills policies
create policy "Users can view their own bills"
  on public.bills for select using (auth.uid() = user_id);

create policy "Users can insert their own bills"
  on public.bills for insert with check (auth.uid() = user_id);

create policy "Users can update their own bills"
  on public.bills for update using (auth.uid() = user_id);

create policy "Users can delete their own bills"
  on public.bills for delete using (auth.uid() = user_id);

-- Bill items policies (via bill ownership)
create policy "Users can view their own bill items"
  on public.bill_items for select
  using (exists (select 1 from public.bills where bills.id = bill_items.bill_id and bills.user_id = auth.uid()));

create policy "Users can insert their own bill items"
  on public.bill_items for insert
  with check (exists (select 1 from public.bills where bills.id = bill_items.bill_id and bills.user_id = auth.uid()));

create policy "Users can delete their own bill items"
  on public.bill_items for delete
  using (exists (select 1 from public.bills where bills.id = bill_items.bill_id and bills.user_id = auth.uid()));
