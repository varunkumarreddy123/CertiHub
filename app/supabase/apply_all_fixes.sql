-- Run this ONCE in Supabase SQL Editor to apply all bug fixes
-- CertiHub / CertiChain - Complete fix script

-- 1. Superadmin can approve/reject institutions
DROP POLICY IF EXISTS "Superadmins can update any profile" ON public.profiles;
CREATE POLICY "Superadmins can update any profile" ON public.profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin')
);

DROP POLICY IF EXISTS "Superadmins can delete profiles" ON public.profiles;
CREATE POLICY "Superadmins can delete profiles" ON public.profiles FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin')
);

-- 2. Allow hash repair for certificate verification fix
DROP POLICY IF EXISTS "Authenticated can update blockchain_anchors" ON public.blockchain_anchors;
CREATE POLICY "Authenticated can update blockchain_anchors" ON public.blockchain_anchors FOR UPDATE USING (auth.role() = 'authenticated');
