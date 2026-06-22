GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;

DROP POLICY IF EXISTS "Admins upload ads" ON storage.objects;
DROP POLICY IF EXISTS "Admins update ads" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete ads" ON storage.objects;
DROP POLICY IF EXISTS "ads admin insert" ON storage.objects;
DROP POLICY IF EXISTS "ads admin update" ON storage.objects;
DROP POLICY IF EXISTS "ads admin delete" ON storage.objects;
DROP POLICY IF EXISTS "Admin can preview ads bucket objects" ON storage.objects;
DROP POLICY IF EXISTS "Admin email can upload ads bucket objects" ON storage.objects;
DROP POLICY IF EXISTS "Admin email can update ads bucket objects" ON storage.objects;
DROP POLICY IF EXISTS "Admin email can delete ads bucket objects" ON storage.objects;

CREATE POLICY "Admin can preview ads bucket objects"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'ads'
  AND lower(coalesce(auth.jwt() ->> 'email', '')) = 'siddarthahmed696@gmail.com'
);

CREATE POLICY "Admin email can upload ads bucket objects"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ads'
  AND lower(coalesce(auth.jwt() ->> 'email', '')) = 'siddarthahmed696@gmail.com'
);

CREATE POLICY "Admin email can update ads bucket objects"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'ads'
  AND lower(coalesce(auth.jwt() ->> 'email', '')) = 'siddarthahmed696@gmail.com'
)
WITH CHECK (
  bucket_id = 'ads'
  AND lower(coalesce(auth.jwt() ->> 'email', '')) = 'siddarthahmed696@gmail.com'
);

CREATE POLICY "Admin email can delete ads bucket objects"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'ads'
  AND lower(coalesce(auth.jwt() ->> 'email', '')) = 'siddarthahmed696@gmail.com'
);