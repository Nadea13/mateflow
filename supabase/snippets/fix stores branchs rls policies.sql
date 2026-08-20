-- 1. FIX STORES TABLE RLS POLICIES
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own stores" ON public.stores;
DROP POLICY IF EXISTS "Allow authenticated users to insert stores" ON public.stores;
DROP POLICY IF EXISTS "Allow authenticated users to select stores" ON public.stores;
DROP POLICY IF EXISTS "Allow authenticated users to update stores" ON public.stores;
DROP POLICY IF EXISTS "Allow authenticated users to delete stores" ON public.stores;

-- อนุญาตให้ User สร้างร้านค้าใหม่ได้
CREATE POLICY "Allow authenticated users to insert stores" 
ON public.stores 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = owner_id OR owner_id IS NULL OR auth.uid() = id);

-- อนุญาตให้ User อ่านข้อมูลร้านของตนเองได้
CREATE POLICY "Allow authenticated users to select stores" 
ON public.stores 
FOR SELECT 
TO authenticated 
USING (auth.uid() = owner_id OR auth.uid() = id);

-- อนุญาตให้ User อัปเดตข้อมูลร้านของตนเองได้
CREATE POLICY "Allow authenticated users to update stores" 
ON public.stores 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = owner_id OR auth.uid() = id) 
WITH CHECK (auth.uid() = owner_id OR auth.uid() = id);

-- อนุญาตให้ User ลบร้านของตนเองได้
CREATE POLICY "Allow authenticated users to delete stores" 
ON public.stores 
FOR DELETE 
TO authenticated 
USING (auth.uid() = owner_id OR auth.uid() = id);

-- 2. FIX BRANCHS TABLE RLS POLICIES
ALTER TABLE public.branchs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all branch operations for authenticated users" ON public.branchs;

CREATE POLICY "Allow all branch operations for authenticated users" 
ON public.branchs 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);