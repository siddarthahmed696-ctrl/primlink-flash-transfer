CREATE OR REPLACE FUNCTION public.create_transfer(_title text, _message text, _sender_email text, _recipient_email text, _total_size bigint)
 RETURNS TABLE(id uuid, share_code text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF COALESCE(_total_size, 0) < 0 OR COALESCE(_total_size, 0) > 104857600 THEN
    RAISE EXCEPTION 'Free transfers are limited to 100 MB';
  END IF;

  RETURN QUERY
  INSERT INTO public.transfers(title, message, sender_email, recipient_email, total_size, expires_at)
  VALUES (_title, _message, _sender_email, _recipient_email, COALESCE(_total_size, 0), now() + interval '3 days')
  RETURNING transfers.id, transfers.share_code;
END;
$function$;

ALTER TABLE public.transfers ALTER COLUMN expires_at SET DEFAULT (now() + interval '3 days');