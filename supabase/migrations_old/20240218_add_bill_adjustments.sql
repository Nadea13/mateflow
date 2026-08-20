-- Add adjustments column to bills (stores discounts, taxes, etc.)
-- Each adjustment: { label: string, type: 'percent' | 'fixed', value: number }
alter table public.bills add column if not exists adjustments jsonb default '[]'::jsonb;
