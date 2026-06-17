-- Restrict UPDATE on transfers storage bucket to the original uploader
DROP POLICY IF EXISTS "Public update transfers bucket" ON storage.objects;

CREATE POLICY "Uploader can update own transfer objects"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'transfers' AND owner = auth.uid())
WITH CHECK (bucket_id = 'transfers' AND owner = auth.uid());

-- Make implicit deny explicit on visitors for write paths
CREATE POLICY "No direct insert on visitors"
ON public.visitors FOR INSERT
TO anon, authenticated
WITH CHECK (false);

CREATE POLICY "No direct update on visitors"
ON public.visitors FOR UPDATE
TO anon, authenticated
USING (false) WITH CHECK (false);

CREATE POLICY "No direct delete on visitors"
ON public.visitors FOR DELETE
TO anon, authenticated
USING (false);
