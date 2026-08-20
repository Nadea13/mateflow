-- Migration: Add missing store profile columns for Mateflow
-- Description: Adds tax_id, store_phone, store_address, and signature_url to public.profiles table

DO $$
BEGIN
    -- Add tax_id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'tax_id'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN tax_id TEXT;
    END IF;

    -- Add store_phone if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'store_phone'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN store_phone TEXT;
    END IF;

    -- Add store_address if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'store_address'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN store_address TEXT;
    END IF;

    -- Add signature_url if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'signature_url'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN signature_url TEXT;
    END IF;
END $$;
