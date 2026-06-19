
CREATE OR REPLACE FUNCTION public.is_recent_transfer(_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.transfers t
    WHERE t.id::text = _id
      AND t.created_at > (now() - interval '1 hour')
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_recent_transfer(text) TO anon, authenticated;

DROP POLICY IF EXISTS "Upload to own recent transfer" ON storage.objects;

CREATE POLICY "Upload to own recent transfer"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'transfers'
  AND public.is_recent_transfer(split_part(name, '/', 1))
);
