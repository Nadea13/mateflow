-- Add tax-related fields to expenses table
ALTER TABLE expenses 
    ADD COLUMN vendor_name text,
    ADD COLUMN vendor_tax_id text,
    ADD COLUMN wht_rate numeric,
    ADD COLUMN wht_amount numeric,
    ADD COLUMN input_vat numeric;
