DROP POLICY IF EXISTS "Anyone can view transfers" ON public.transfers;
DROP POLICY IF EXISTS "Anyone can update download count" ON public.transfers;
DROP POLICY IF EXISTS "Anyone can view files" ON public.transfer_files;
DROP POLICY IF EXISTS "Public read from transfers bucket" ON storage.objects;

REVOKE SELECT, UPDATE, DELETE ON public.transfers FROM anon, authenticated;
REVOKE SELECT, UPDATE, DELETE ON public.transfer_files FROM anon, authenticated;
GRANT INSERT ON public.transfers TO anon, authenticated;
GRANT INSERT ON public.transfer_files TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_transfer(
  _title text,
  _message text,
  _sender_email text,
  _recipient_email text,
  _total_size bigint
) RETURNS TABLE(id uuid, share_code text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
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
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.transfers WHERE id = _transfer_id) THEN
    RAISE EXCEPTION 'Transfer not found';
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

CREATE OR REPLACE FUNCTION public.get_transfer_by_code(_code text)
RETURNS TABLE(
  id uuid, share_code text, title text, message text, sender_email text,
  total_size bigint, download_count integer,
  created_at timestamptz, expires_at timestamptz
)
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT id, share_code, title, message, sender_email, total_size,
         download_count, created_at, expires_at
  FROM public.transfers
  WHERE share_code = _code;
$$;
GRANT EXECUTE ON FUNCTION public.get_transfer_by_code(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_transfer_files_by_code(_code text)
RETURNS TABLE(id uuid, file_name text, file_size bigint, content_type text)
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT f.id, f.file_name, f.file_size, f.content_type
  FROM public.transfer_files f
  JOIN public.transfers t ON t.id = f.transfer_id
  WHERE t.share_code = _code
  ORDER BY f.created_at;
$$;
GRANT EXECUTE ON FUNCTION public.get_transfer_files_by_code(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.increment_download_count(_code text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.transfers
  SET download_count = download_count + 1
  WHERE share_code = _code;
$$;
GRANT EXECUTE ON FUNCTION public.increment_download_count(text) TO anon, authenticated;