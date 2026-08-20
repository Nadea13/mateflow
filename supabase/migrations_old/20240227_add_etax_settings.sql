-- Add E-Tax integration fields to the profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS etax_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS etax_api_key TEXT,
ADD COLUMN IF NOT EXISTS etax_company_id TEXT;
