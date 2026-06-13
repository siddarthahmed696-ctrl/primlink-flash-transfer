
CREATE POLICY "Anyone read ads bucket" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'ads');
CREATE POLICY "Admins upload ads" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'ads' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update ads" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'ads' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete ads" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'ads' AND public.has_role(auth.uid(), 'admin'));
