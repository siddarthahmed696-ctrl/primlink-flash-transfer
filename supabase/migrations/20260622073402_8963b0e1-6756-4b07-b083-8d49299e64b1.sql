DROP POLICY IF EXISTS "Public can read transfers bucket objects" ON storage.objects;
CREATE POLICY "Public can read transfers bucket objects"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'transfers');