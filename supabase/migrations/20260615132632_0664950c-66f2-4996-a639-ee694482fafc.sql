
-- 1. Explicit deny-all SELECT policies (documents intent; RPCs are SECURITY DEFINER and bypass RLS)
CREATE POLICY "No direct reads on transfers"
ON public.transfers FOR SELECT
TO anon, authenticated
USING (false);

CREATE POLICY "No direct reads on transfer_files"
ON public.transfer_files FOR SELECT
TO anon, authenticated
USING (false);

-- 2. Remove hijackable visitors UPDATE policy; route heartbeats through a SECURITY DEFINER RPC
DROP POLICY IF EXISTS "Heartbeat update bounded" ON public.visitors;
DROP POLICY IF EXISTS "Anyone can heartbeat insert" ON public.visitors;

CREATE OR REPLACE FUNCTION public.heartbeat_visitor(_session_id text, _path text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF _session_id IS NULL OR length(_session_id) < 8 OR length(_session_id) > 128 THEN
    RAISE EXCEPTION 'invalid session_id';
  END IF;
  IF _path IS NOT NULL AND length(_path) > 512 THEN
    _path := substring(_path from 1 for 512);
  END IF;
  INSERT INTO public.visitors(session_id, path, last_seen)
  VALUES (_session_id, _path, now())
  ON CONFLICT (session_id) DO UPDATE
    SET path = EXCLUDED.path, last_seen = now();
END;
$$;

REVOKE ALL ON FUNCTION public.heartbeat_visitor(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.heartbeat_visitor(text, text) TO anon, authenticated;
