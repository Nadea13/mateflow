ALTER TABLE public.bills DROP CONSTRAINT IF EXISTS bills_status_check;
ALTER TABLE public.bills ADD CONSTRAINT bills_status_check CHECK (status IN ('quotation', 'draft', 'paid', 'cancelled'));