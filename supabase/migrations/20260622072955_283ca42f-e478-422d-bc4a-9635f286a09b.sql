DROP POLICY IF EXISTS "Public can read ads bucket objects" ON storage.objects;
CREATE POLICY "Public can read ads bucket objects"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'ads');