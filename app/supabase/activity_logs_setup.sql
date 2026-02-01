-- Run this in Supabase SQL Editor to create activity_logs and enable reads
-- CertiHub - Activity logs table and RLS

-- 1. Create activity_logs table (if not exists)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  user_name text NOT NULL,
  action text NOT NULL,
  details text NOT NULL,
  type text NOT NULL,
  timestamp timestamptz NOT NULL DEFAULT now()
);

-- 2. Enable RLS (safe if already enabled)
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if any (idempotent - safe to run multiple times)
DROP POLICY IF EXISTS "Authenticated can read activity_logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Authenticated can insert activity_logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Allow read activity_logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Allow insert activity_logs" ON public.activity_logs;

-- 4. Allow authenticated users to read all activity logs
CREATE POLICY "Authenticated can read activity_logs" ON public.activity_logs
  FOR SELECT USING (auth.role() = 'authenticated');

-- 5. Allow authenticated users to insert activity logs
CREATE POLICY "Authenticated can insert activity_logs" ON public.activity_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 6. Grant access
GRANT ALL ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
