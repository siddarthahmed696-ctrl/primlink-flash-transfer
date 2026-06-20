
-- Explicit deny SELECT on transfers bucket for anon/authenticated.
-- Downloads must go through server-side signed URLs (service role).
DROP POLICY IF EXISTS "Deny direct reads on transfers bucket" ON storage.objects;
CREATE POLICY "Deny direct reads on transfers bucket"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (false);

-- Explicit deny INSERT on transfer_files for anon/authenticated.
-- Rows are only inserted via the SECURITY DEFINER RPC add_transfer_files.
DROP POLICY IF EXISTS "No direct insert on transfer_files" ON public.transfer_files;
CREATE POLICY "No direct insert on transfer_files"
ON public.transfer_files
FOR INSERT
TO anon, authenticated
WITH CHECK (false);
