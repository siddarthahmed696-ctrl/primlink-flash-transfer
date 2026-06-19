DROP POLICY IF EXISTS "Upload to own recent transfer" ON storage.objects;

CREATE POLICY "Upload transfer objects"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'transfers');