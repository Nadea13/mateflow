-- 1. ปลดล็อค Constraint เก่าที่ผูก id ร้านเข้ากับ user_id
ALTER TABLE public.stores DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.stores DROP CONSTRAINT IF EXISTS stores_id_fkey;

-- 2. มั่นใจว่า stores.id สามารถสุ่ม UUID ใหม่ได้อย่างอิสระ
ALTER TABLE public.stores ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 3. มั่นใจว่า owner_id เชื่อมต่อกับ public.users(id) อย่างถูกต้อง
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' 
        AND table_name = 'stores' 
        AND constraint_name = 'fk_stores_owner_id'
    ) THEN
        ALTER TABLE public.stores 
        ADD CONSTRAINT fk_stores_owner_id 
        FOREIGN KEY (owner_id) 
        REFERENCES public.users(id) 
        ON DELETE CASCADE;
    END IF;
END $$;