CREATE OR REPLACE FUNCTION public.create_transfer(
  _title text,
  _message text,
  _sender_email text,
  _recipient_email text,
  _total_size bigint
) RETURNS TABLE(id uuid, share_code text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(_total_size, 0) < 0 OR COALESCE(_total_size, 0) > 104857600 THEN
    RAISE EXCEPTION 'Free transfers are limited to 100 MB';
  END IF;

  RETURN QUERY
  INSERT INTO public.transfers(title, message, sender_email, recipient_email, total_size)
  VALUES (_title, _message, _sender_email, _recipient_email, COALESCE(_total_size, 0))
  RETURNING transfers.id, transfers.share_code;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_transfer(text,text,text,text,bigint) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.add_transfer_files(
  _transfer_id uuid,
  _files jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _files_total bigint;
  _invalid_count integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.transfers WHERE id = _transfer_id) THEN
    RAISE EXCEPTION 'Transfer not found';
  END IF;

  SELECT COALESCE(SUM((f->>'file_size')::bigint), 0),
         COUNT(*) FILTER (
           WHERE (f->>'file_size')::bigint < 0
              OR (f->>'file_size')::bigint > 104857600
              OR (f->>'storage_path') IS NULL
              OR (f->>'storage_path') NOT LIKE (_transfer_id::text || '/%')
         )
  INTO _files_total, _invalid_count
  FROM jsonb_array_elements(_files) f;

  IF _invalid_count > 0 OR _files_total > 104857600 THEN
    RAISE EXCEPTION 'Free transfers are limited to 100 MB';
  END IF;

  INSERT INTO public.transfer_files(transfer_id, file_name, file_size, content_type, storage_path)
  SELECT _transfer_id,
         (f->>'file_name'),
         (f->>'file_size')::bigint,
         (f->>'content_type'),
         (f->>'storage_path')
  FROM jsonb_array_elements(_files) f;
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_transfer_files(uuid, jsonb) TO anon, authenticated;

DROP POLICY IF EXISTS "Upload to own recent transfer" ON storage.objects;

CREATE POLICY "Upload to own recent transfer"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'transfers'
  AND public.is_recent_transfer(split_part(name, '/', 1))
);