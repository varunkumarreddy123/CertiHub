-- Allow users to delete their own messages
-- Run in Supabase SQL Editor if delete fails with RLS error

DROP POLICY IF EXISTS "Users can delete own messages" ON public.messages;
CREATE POLICY "Users can delete own messages" ON public.messages
  FOR DELETE USING (auth.uid() = sender_id);
