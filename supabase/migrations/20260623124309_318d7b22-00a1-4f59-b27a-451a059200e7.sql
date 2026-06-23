-- Allow anonymous (and authenticated) uploads to the transfers bucket
-- as long as the path's first segment matches a transfer row created in the
-- last hour. This is the permanent fix for "upload failed" on the public site
-- where users are not signed in.

DROP POLICY IF EXISTS "Upload to own recent transfer" ON storage.objects;
DROP POLICY IF EXISTS "Public upload to recent transfer" ON storage.objects;

CREATE POLICY "Public upload to recent transfer"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'transfers'
  AND public.is_recent_transfer(split_part(name, '/', 1))
);

-- Also allow updating the in-progress object during resumable uploads for anon
DROP POLICY IF EXISTS "Update own in-progress transfer upload" ON storage.objects;
CREATE POLICY "Update in-progress transfer upload"
ON storage.objects
FOR UPDATE
TO anon, authenticated
USING (
  bucket_id = 'transfers'
  AND public.is_recent_transfer(split_part(name, '/', 1))
)
WITH CHECK (
  bucket_id = 'transfers'
  AND public.is_recent_transfer(split_part(name, '/', 1))
);
