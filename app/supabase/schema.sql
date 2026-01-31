-- CertiHub / CertiChain Supabase schema
-- Run this in Supabase Dashboard > SQL Editor to create tables.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles (extends Supabase Auth; id = auth.uid())
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin')),
  is_verified BOOLEAN NOT NULL DEFAULT true,
  institution_name TEXT,
  institution_address TEXT,
  wallet_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Certificates
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unique_id TEXT NOT NULL UNIQUE,
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  course_name TEXT NOT NULL,
  institution_name TEXT NOT NULL,
  institution_id TEXT NOT NULL,
  issue_date DATE NOT NULL,
  expiry_date DATE,
  grade TEXT,
  description TEXT,
  ipfs_hash TEXT,
  blockchain_tx_hash TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_certificates_unique_id ON public.certificates(unique_id);
CREATE INDEX IF NOT EXISTS idx_certificates_institution_id ON public.certificates(institution_id);
CREATE INDEX IF NOT EXISTS idx_certificates_student_email ON public.certificates(lower(student_email));

-- Institution applications
CREATE TABLE IF NOT EXISTS public.institution_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  institution_name TEXT NOT NULL,
  institution_address TEXT NOT NULL,
  registration_number TEXT NOT NULL,
  website TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  documents TEXT[],
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id),
  rejection_reason TEXT
);

-- Activity logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('certificate', 'institution', 'verification', 'system')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('success', 'error', 'warning', 'info')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- Conversations
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'certificate_issue', 'verification_help', 'account_help', 'technical_support', 'other')),
  participant_ids UUID[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  unread_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Messages
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('user', 'admin', 'superadmin')),
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_name TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_read BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);

-- Blockchain anchors (mandatory: hash stored for verification)
CREATE TABLE IF NOT EXISTS public.blockchain_anchors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  certificate_id UUID NOT NULL REFERENCES public.certificates(id) ON DELETE CASCADE,
  unique_id TEXT NOT NULL UNIQUE,
  hash TEXT NOT NULL,
  block_number INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blockchain_anchors_unique_id ON public.blockchain_anchors(unique_id);

-- RLS (Row Level Security) policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_anchors ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update own profile; superadmins can update/delete any profile
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
-- Superadmin/admin need to read other profiles (for dashboard); allow read all for authenticated
CREATE POLICY "Authenticated can read all profiles" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
-- Superadmins can verify/reject institutions by updating/deleting their profiles
CREATE POLICY "Superadmins can update any profile" ON public.profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin')
);
CREATE POLICY "Superadmins can delete profiles" ON public.profiles FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin')
);

-- Certificates: admins of institution can manage; anyone can read for verification
CREATE POLICY "Anyone can read certificates" ON public.certificates FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert certificates" ON public.certificates FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can update certificates" ON public.certificates FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can delete certificates" ON public.certificates FOR DELETE USING (auth.role() = 'authenticated');

-- Activity logs: authenticated read/insert
CREATE POLICY "Authenticated can read activity_logs" ON public.activity_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can insert activity_logs" ON public.activity_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Notifications: user can read/update own
CREATE POLICY "Users can read own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Authenticated can insert notifications" ON public.notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Conversations: participants only
CREATE POLICY "Participants can read conversations" ON public.conversations FOR SELECT USING (auth.uid() = ANY(participant_ids));
CREATE POLICY "Authenticated can insert conversations" ON public.conversations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Participants can update conversations" ON public.conversations FOR UPDATE USING (auth.uid() = ANY(participant_ids));

-- Messages: conversation participants
CREATE POLICY "Participants can read messages" ON public.messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id AND auth.uid() = ANY(c.participant_ids)
  )
);
CREATE POLICY "Authenticated can insert messages" ON public.messages FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Institution applications
CREATE POLICY "Authenticated can read institution_applications" ON public.institution_applications FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert own application" ON public.institution_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated can update institution_applications" ON public.institution_applications FOR UPDATE USING (auth.role() = 'authenticated');

-- Blockchain anchors: read for verification, insert with certificate, update for hash repair
CREATE POLICY "Anyone can read blockchain_anchors" ON public.blockchain_anchors FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert blockchain_anchors" ON public.blockchain_anchors FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can update blockchain_anchors" ON public.blockchain_anchors FOR UPDATE USING (auth.role() = 'authenticated');

-- Trigger: create profile on signup with institution data from metadata
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- When a profile is created/updated as institution (admin), ensure an application row exists for Super Admin
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

-- One application per user (unique so trigger can upsert)
ALTER TABLE public.institution_applications DROP CONSTRAINT IF EXISTS institution_applications_user_id_key;
ALTER TABLE public.institution_applications ADD CONSTRAINT institution_applications_user_id_key UNIQUE (user_id);

DROP TRIGGER IF EXISTS on_profile_institution ON public.profiles;
CREATE TRIGGER on_profile_institution
  AFTER INSERT OR UPDATE OF role, institution_name ON public.profiles
  FOR EACH ROW
  WHEN (NEW.role = 'admin' AND NEW.institution_name IS NOT NULL AND NEW.institution_name != '')
  EXECUTE FUNCTION public.handle_institution_profile();

-- To create the first Super Admin: create a user in Supabase Auth (Dashboard > Authentication > Users > Add user),
-- then run: UPDATE public.profiles SET role = 'superadmin', is_verified = true WHERE email = 'your-superadmin@email.com';
