-- 1. เปลี่ยนชื่อตาราง profiles เป็น stores
ALTER TABLE public.profiles RENAME TO stores;

-- 2. เปลี่ยนชื่อตาราง locations เป็น branchs
ALTER TABLE public.locations RENAME TO branchs;

-- 3. เปลี่ยนชื่อคอลัมน์ user_id เป็น store_id ในตาราง branchs
ALTER TABLE public.branchs RENAME COLUMN user_id TO store_id;