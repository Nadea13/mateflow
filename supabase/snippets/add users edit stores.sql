-- 1. สร้างตาราง users และ Sync จาก auth.users
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text UNIQUE NOT NULL,
    full_name text,
    avatar_url text,
    provider text DEFAULT 'email',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. ปรับปรุงตาราง stores ให้มี UUID อิสระ และ owner_id
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.stores DROP COLUMN IF EXISTS email;
ALTER TABLE public.stores ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 3. Trigger ซิงค์ผู้ใช้ใหม่อัตโนมัติ
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    END IF;
END $$;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();