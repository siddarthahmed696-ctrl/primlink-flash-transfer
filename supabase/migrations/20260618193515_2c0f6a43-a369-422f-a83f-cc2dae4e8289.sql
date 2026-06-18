
-- 1. Fix has_role to work from any context (standard pattern)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 2. transfer_files: remove open INSERT, force RPC path
DROP POLICY IF EXISTS "Anyone can add files" ON public.transfer_files;
-- (add_transfer_files RPC is SECURITY DEFINER and remains the only writer)

-- 3. Storage: lock down 'transfers' bucket
DROP POLICY IF EXISTS "Public select transfers bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public upload to transfers bucket" ON storage.objects;

-- Restrict uploads: must be authenticated (anonymous sign-in counts),
-- path must start with an existing transfer id created in the last hour.
CREATE POLICY "Upload to own recent transfer"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'transfers'
  AND EXISTS (
    SELECT 1 FROM public.transfers t
    WHERE t.id::text = split_part(name, '/', 1)
      AND t.created_at > now() - interval '1 hour'
  )
);

-- Allow tus resumable to update its own in-progress object during chunked upload
CREATE POLICY "Update own in-progress transfer upload"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'transfers'
  AND owner = auth.uid()
)
WITH CHECK (
  bucket_id = 'transfers'
  AND owner = auth.uid()
);

-- Note: No SELECT policy for anon/authenticated on the transfers bucket.
-- Downloads are issued exclusively via short-lived signed URLs from the
-- getDownloadUrl server function using the service role.
