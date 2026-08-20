-- 1. สร้าง FK: stores.owner_id -> users.id
ALTER TABLE public.stores 
ADD CONSTRAINT fk_stores_owner_id 
FOREIGN KEY (owner_id) 
REFERENCES public.users(id) 
ON DELETE CASCADE;
-- 2. สร้าง FK: branchs.store_id -> stores.id
ALTER TABLE public.branchs 
ADD CONSTRAINT fk_branchs_store_id 
FOREIGN KEY (store_id) 
REFERENCES public.stores(id) 
ON DELETE CASCADE;