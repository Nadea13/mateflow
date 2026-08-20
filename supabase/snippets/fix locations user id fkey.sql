-- 1. ปลดล็อค Constraint เก่าที่เคยผูกไว้กับ user_id
ALTER TABLE public.branchs DROP CONSTRAINT IF EXISTS locations_user_id_fkey;
ALTER TABLE public.branchs DROP CONSTRAINT IF EXISTS branchs_user_id_fkey;

-- 2. มั่นใจว่า store_id ผูก Foreign Key เข้ากับตาราง stores(id) อย่างถูกต้อง
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' 
        AND table_name = 'branchs' 
        AND constraint_name = 'fk_branchs_store_id'
    ) THEN
        ALTER TABLE public.branchs 
        ADD CONSTRAINT fk_branchs_store_id 
        FOREIGN KEY (store_id) 
        REFERENCES public.stores(id) 
        ON DELETE CASCADE;
    END IF;
END $$;