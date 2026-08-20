-- Create expenses table
create table public.expenses (
  id uuid not null default gen_random_uuid(),
  user_id uuid references auth.users not null,
  title text not null,
  amount decimal(10,2) not null,
  category text not null,
  description text,
  date date not null default current_date,
  receipt_url text,
  created_at timestamptz not null default now(),
  primary key (id)
);

-- Enable RLS
alter table public.expenses enable row level security;

-- Expenses policies
create policy "Users can view their own expenses"
  on public.expenses for select using (auth.uid() = user_id);

create policy "Users can insert their own expenses"
  on public.expenses for insert with check (auth.uid() = user_id);

create policy "Users can update their own expenses"
  on public.expenses for update using (auth.uid() = user_id);

create policy "Users can delete their own expenses"
  on public.expenses for delete using (auth.uid() = user_id);

-- Create storage bucket for receipts if not exists
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true)
on conflict (id) do nothing;

-- Storage policies for receipts
create policy "Receipt images are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'receipts' );

create policy "Users can upload receipt images"
  on storage.objects for insert
  with check ( bucket_id = 'receipts' and auth.uid() = (storage.foldername(name))[1]::uuid );
