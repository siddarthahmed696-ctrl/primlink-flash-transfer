CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    _user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = _user_id
        AND role = _role
    ),
    false
  )
$function$;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

DROP POLICY IF EXISTS "Public can view active ads" ON public.site_ads;
CREATE POLICY "Public can view active ads"
ON public.site_ads
FOR SELECT
TO anon, authenticated
USING (is_active = true);

DROP POLICY IF EXISTS "Admins view all ads" ON public.site_ads;
CREATE POLICY "Admins view all ads"
ON public.site_ads
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));