
-- Ads bucket: drop hardcoded-email policies, recreate using has_role()
DROP POLICY IF EXISTS "Admin can preview ads bucket objects" ON storage.objects;
DROP POLICY IF EXISTS "Admin email can upload ads bucket objects" ON storage.objects;
DROP POLICY IF EXISTS "Admin email can update ads bucket objects" ON storage.objects;
DROP POLICY IF EXISTS "Admin email can delete ads bucket objects" ON storage.objects;

CREATE POLICY "Admins can read ads bucket objects"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'ads' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can upload ads bucket objects"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'ads' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update ads bucket objects"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'ads' AND public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (bucket_id = 'ads' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete ads bucket objects"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'ads' AND public.has_role(auth.uid(), 'admin'::public.app_role));

-- Transfers bucket: let uploaders delete their own objects
CREATE POLICY "Uploader can delete own transfer objects"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'transfers' AND owner = auth.uid());
