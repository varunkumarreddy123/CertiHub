-- Run this in Supabase SQL Editor to fix "Failed to verify institution" error
-- This allows superadmins to update/delete any profile (for approving/rejecting institutions)

DROP POLICY IF EXISTS "Superadmins can update any profile" ON public.profiles;
CREATE POLICY "Superadmins can update any profile" ON public.profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin')
);

DROP POLICY IF EXISTS "Superadmins can delete profiles" ON public.profiles;
CREATE POLICY "Superadmins can delete profiles" ON public.profiles FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin')
);
