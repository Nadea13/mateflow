-- Create messages table
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text check (role in ('user', 'assistant')) not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create products table
create table public.products (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  price decimal(10,2) not null,
  stock integer default 0 not null,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create orders table
create table public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  total_amount decimal(10,2) not null,
  status text check (status in ('pending', 'processing', 'completed', 'cancelled')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.messages enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;

-- Create policies
create policy "Users can view their own messages" on public.messages
  for select using (auth.uid() = user_id);

create policy "Users can insert their own messages" on public.messages
  for insert with check (auth.uid() = user_id);

create policy "Users can view their own products" on public.products
  for select using (auth.uid() = user_id);

create policy "Users can manage their own products" on public.products
  for all using (auth.uid() = user_id);

create policy "Users can view their own orders" on public.orders
  for select using (auth.uid() = user_id);

-- Seed some initial data (products)
-- Note: User ID will be needed for real application, but for now we can rely on manual insertion or just let it be empty until created
