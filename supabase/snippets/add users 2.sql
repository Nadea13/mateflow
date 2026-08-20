-- 1. สร้างตาราง users รองรับทุกฟิลด์จาก auth.users
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text UNIQUE NOT NULL,
    phone text,
    full_name text,
    avatar_url text,
    provider text DEFAULT 'email',
    raw_user_meta_data jsonb,
    raw_app_meta_data jsonb,
    email_confirmed_at timestamptz,
    phone_confirmed_at timestamptz,
    last_sign_in_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
-- 2. ดึงข้อมูล User เดิมทั้งหมดจาก auth.users มาใส่ทันที
INSERT INTO public.users (
    id, 
    email, 
    phone,
    full_name, 
    avatar_url, 
    provider,
    raw_user_meta_data,
    raw_app_meta_data,
    email_confirmed_at,
    phone_confirmed_at,
    last_sign_in_at,
    created_at, 
    updated_at
)
SELECT 
    id, 
    email, 
    phone,
    COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1)),
    raw_user_meta_data->>'avatar_url',
    COALESCE(raw_app_meta_data->>'provider', 'email'),
    raw_user_meta_data,
    raw_app_meta_data,
    email_confirmed_at,
    phone_confirmed_at,
    last_sign_in_at,
    created_at,
    COALESCE(updated_at, created_at)
FROM auth.users
ON CONFLICT (id) DO UPDATE 
SET email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    provider = EXCLUDED.provider,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    raw_app_meta_data = EXCLUDED.raw_app_meta_data,
    email_confirmed_at = EXCLUDED.email_confirmed_at,
    phone_confirmed_at = EXCLUDED.phone_confirmed_at,
    last_sign_in_at = EXCLUDED.last_sign_in_at,
    updated_at = now();