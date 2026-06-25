-- =========================================================
-- members: keep table fully locked. No direct Data API access.
-- All access goes through SECURITY DEFINER RPCs / service role.
-- =========================================================
REVOKE ALL ON public.members FROM anon, authenticated;
REVOKE ALL ON public.settings FROM anon, authenticated;

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny all direct client access to members" ON public.members;
CREATE POLICY "Deny all direct client access to members"
ON public.members
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- =========================================================
-- storage.objects: lock down the private 'reset-proofs' bucket.
-- RLS is already enabled on storage.objects; we only add policies.
-- All uploads/reads happen server-side via the service role (bypasses RLS).
-- Explicitly deny every client operation on this bucket.
-- =========================================================
DROP POLICY IF EXISTS "Deny client access to reset-proofs bucket" ON storage.objects;
CREATE POLICY "Deny client access to reset-proofs bucket"
ON storage.objects
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (bucket_id <> 'reset-proofs')
WITH CHECK (bucket_id <> 'reset-proofs');
