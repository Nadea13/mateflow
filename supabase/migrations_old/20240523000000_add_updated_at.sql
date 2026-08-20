
alter table public.products 
add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now());

update public.products 
set updated_at = created_at 
where updated_at is null;

alter table public.products 
alter column updated_at set not null;
