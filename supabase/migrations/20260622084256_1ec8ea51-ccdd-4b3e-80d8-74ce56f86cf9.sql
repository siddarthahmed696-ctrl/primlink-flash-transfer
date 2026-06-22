
-- ADS bucket: admin-only writes, public read stays
DROP POLICY IF EXISTS "ads_insert_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "ads_update_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "ads_delete_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "ads admin insert" ON storage.objects;
DROP POLICY IF EXISTS "ads admin update" ON storage.objects;
DROP POLICY IF EXISTS "ads admin delete" ON storage.objects;

CREATE POLICY "ads admin insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ads' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "ads admin update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'ads' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'ads' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "ads admin delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'ads' AND public.has_role(auth.uid(), 'admin'));

-- TRANSFERS bucket: remove any public/anon read; downloads go through signed-URL server fn (service role)
DROP POLICY IF EXISTS "transfers_public_read" ON storage.objects;
DROP POLICY IF EXISTS "transfers public read" ON storage.objects;
DROP POLICY IF EXISTS "transfers anon read" ON storage.objects;
DROP POLICY IF EXISTS "Public read transfers" ON storage.objects;
