-- Add soft delete support to profiles
alter table public.profiles add column if not exists deleted_at timestamptz;

-- Update RLS: Only non-deleted profiles are visible
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id and deleted_at is null);
