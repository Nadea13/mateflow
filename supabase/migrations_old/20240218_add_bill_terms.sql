-- Add payment_terms and validity_days to bills
alter table public.bills add column if not exists payment_terms integer default 0; -- Credit days (e.g. 30)
alter table public.bills add column if not exists validity_days integer default 7; -- Quotation validity days (e.g. 7)
