-- Add store address, tax ID, and signature/stamp URL to profiles
alter table public.profiles add column if not exists store_address text;
alter table public.profiles add column if not exists tax_id text;
alter table public.profiles add column if not exists signature_url text;
alter table public.profiles add column if not exists store_phone text;
