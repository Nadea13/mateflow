-- Create customers table
create table public.customers (
  id uuid not null default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  email text,
  phone text,
  address text,
  line_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (id)
);

-- Enable RLS
alter table public.customers enable row level security;

-- Create policies
create policy "Users can view their own customers"
  on public.customers for select
  using (auth.uid() = user_id);

create policy "Users can insert their own customers"
  on public.customers for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own customers"
  on public.customers for update
  using (auth.uid() = user_id);

create policy "Users can delete their own customers"
  on public.customers for delete
  using (auth.uid() = user_id);
