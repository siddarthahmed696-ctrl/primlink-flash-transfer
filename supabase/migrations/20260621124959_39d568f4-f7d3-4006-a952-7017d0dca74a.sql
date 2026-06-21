
CREATE OR REPLACE FUNCTION public.get_download_path(_code text, _file_id uuid)
RETURNS TABLE(storage_path text, file_name text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT f.storage_path, f.file_name
  FROM public.transfer_files f
  JOIN public.transfers t ON t.id = f.transfer_id
  WHERE t.share_code = _code
    AND f.id = _file_id
    AND t.expires_at > now()
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_download_path(text, uuid) TO anon, authenticated;
