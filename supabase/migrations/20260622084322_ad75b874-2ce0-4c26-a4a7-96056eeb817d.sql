
-- ADS bucket: drop overly broad policies
DROP POLICY IF EXISTS "Authenticated can select ads bucket objects" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can insert ads bucket objects" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update ads bucket objects" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete ads bucket objects" ON storage.objects;
DROP POLICY IF EXISTS "Public can read ads bucket objects" ON storage.objects;

-- Keep only admin-role-gated writes (already created). Reads happen exclusively via service-role signed URLs (server fn), so no SELECT policy is needed.

-- TRANSFERS bucket: drop the public read; signed URLs use service role
DROP POLICY IF EXISTS "Public can read transfers bucket objects" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read transfers bucket objects" ON storage.objects;

-- Tighten transfer uploads: only authenticated users may upload
DROP POLICY IF EXISTS "Upload transfer objects" ON storage.objects;
CREATE POLICY "Authenticated upload transfer objects" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'transfers');
