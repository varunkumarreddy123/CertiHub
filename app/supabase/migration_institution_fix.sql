-- Run this in Supabase SQL Editor to fix institution signup and superadmin approval

-- 0. Allow superadmins to update any profile (for verifying institutions)
DROP POLICY IF EXISTS "Superadmins can update any profile" ON public.profiles;
CREATE POLICY "Superadmins can update any profile" ON public.profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin')
);

-- 0b. Allow superadmins to delete profiles (for rejecting institutions)
DROP POLICY IF EXISTS "Superadmins can delete profiles" ON public.profiles;
CREATE POLICY "Superadmins can delete profiles" ON public.profiles FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin')
);
-- 1. Update trigger so profile gets institution_name and institution_address on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, is_verified, institution_name, institution_address)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'email', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    (NEW.raw_user_meta_data->>'role') IS DISTINCT FROM 'admin',
    NEW.raw_user_meta_data->>'institution_name',
    NEW.raw_user_meta_data->>'institution_address'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. One application per user
ALTER TABLE public.institution_applications DROP CONSTRAINT IF EXISTS institution_applications_user_id_key;
ALTER TABLE public.institution_applications ADD CONSTRAINT institution_applications_user_id_key UNIQUE (user_id);

-- 3. When a profile is institution (admin), create/update row in institution_applications
CREATE OR REPLACE FUNCTION public.handle_institution_profile()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'admin' AND NEW.institution_name IS NOT NULL AND NEW.institution_name != '' THEN
    INSERT INTO public.institution_applications (user_id, institution_name, institution_address, registration_number, contact_email, contact_phone, status)
    VALUES (NEW.id, NEW.institution_name, COALESCE(NEW.institution_address, ''), 'Pending', NEW.email, 'Pending', 'pending')
    ON CONFLICT (user_id) DO UPDATE SET
      institution_name = EXCLUDED.institution_name,
      institution_address = EXCLUDED.institution_address,
      contact_email = EXCLUDED.contact_email;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_institution ON public.profiles;
CREATE TRIGGER on_profile_institution
  AFTER INSERT OR UPDATE OF role, institution_name ON public.profiles
  FOR EACH ROW
  WHEN (NEW.role = 'admin' AND NEW.institution_name IS NOT NULL AND NEW.institution_name != '')
  EXECUTE FUNCTION public.handle_institution_profile();
