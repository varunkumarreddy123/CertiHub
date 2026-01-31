-- Run this in Supabase SQL Editor before running the fix-hashes script
-- Adds UPDATE policy so the script can repair certificate hashes

DROP POLICY IF EXISTS "Authenticated can update blockchain_anchors" ON public.blockchain_anchors;
CREATE POLICY "Authenticated can update blockchain_anchors" ON public.blockchain_anchors FOR UPDATE USING (auth.role() = 'authenticated');
