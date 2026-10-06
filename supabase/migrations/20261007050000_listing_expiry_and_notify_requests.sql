BEGIN;

CREATE POLICY listings_select_sold_out_public
  ON public.listings
  FOR SELECT
  TO anon, authenticated
  USING (
    status = 'sold_out'
    AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE)
    AND private.is_approved_shop(shop_id)
  );

DROP POLICY notify_requests_insert_own
  ON public.notify_requests;
REVOKE INSERT ON TABLE public.notify_requests
  FROM PUBLIC, anon, authenticated;
REVOKE INSERT (listing_id, contact_method, contact_value)
  ON TABLE public.notify_requests
  FROM authenticated;

CREATE FUNCTION private.expire_past_dated_listing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.expiry_date IS NOT NULL
     AND NEW.expiry_date < CURRENT_DATE
     AND NEW.status IN ('active', 'sold_out')
  THEN
    NEW.status := 'expired';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER listings_expire_past_dated
  BEFORE INSERT OR UPDATE
  ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION private.expire_past_dated_listing();

REVOKE ALL ON FUNCTION private.expire_past_dated_listing()
  FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.expire_active_listings()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_expired_count integer;
BEGIN
  UPDATE public.listings
  SET status = 'expired'
  WHERE status IN ('active', 'sold_out')
    AND expiry_date < CURRENT_DATE;

  GET DIAGNOSTICS v_expired_count = ROW_COUNT;
  RETURN v_expired_count;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_active_listings()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_active_listings()
  TO service_role;

CREATE FUNCTION public.request_listing_availability(
  _listing_id uuid,
  _contact_method public.notify_contact_method,
  _contact_value text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_contact text := pg_catalog.btrim(_contact_value);
  v_normalized_contact text;
  v_recent_count integer;
BEGIN
  IF _listing_id IS NULL
     OR _contact_method IS NULL
     OR _contact_method NOT IN ('whatsapp', 'email')
     OR v_contact IS NULL
     OR char_length(v_contact) NOT BETWEEN 1 AND 320
  THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'Availability request details are invalid.';
  END IF;

  IF _contact_method = 'email' THEN
    IF v_contact !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
      RAISE EXCEPTION USING
        ERRCODE = '22023',
        MESSAGE = 'Availability request details are invalid.';
    END IF;
    v_normalized_contact := pg_catalog.lower(v_contact);
  ELSE
    IF v_contact !~ '^[+]?[0-9(). -]+$'
       OR char_length(
         pg_catalog.regexp_replace(v_contact, '[^0-9]', '', 'g')
       ) NOT BETWEEN 7 AND 15
    THEN
      RAISE EXCEPTION USING
        ERRCODE = '22023',
        MESSAGE = 'Availability request details are invalid.';
    END IF;
    v_normalized_contact := pg_catalog.regexp_replace(
      v_contact,
      '[^0-9]',
      '',
      'g'
    );
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      _contact_method::text || ':' || v_normalized_contact,
      0
    )
  );

  IF NOT EXISTS (
    SELECT 1
    FROM public.listings AS l
    JOIN public.shops AS s ON s.id = l.shop_id
    WHERE l.id = _listing_id
      AND l.status = 'sold_out'
      AND (l.expiry_date IS NULL OR l.expiry_date >= CURRENT_DATE)
      AND s.approval_status = 'approved'
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0002',
      MESSAGE = 'This item is not currently available for an availability request.';
  END IF;

  SELECT pg_catalog.count(*)::integer
  INTO v_recent_count
  FROM public.notify_requests AS nr
  WHERE nr.contact_method = _contact_method
    AND nr.created_at > pg_catalog.now() - INTERVAL '24 hours'
    AND CASE
      WHEN nr.contact_method = 'email'
        THEN pg_catalog.lower(pg_catalog.btrim(nr.contact_value))
      ELSE pg_catalog.regexp_replace(nr.contact_value, '[^0-9]', '', 'g')
    END = v_normalized_contact;

  IF v_recent_count >= 5 OR EXISTS (
    SELECT 1
    FROM public.notify_requests AS nr
    WHERE nr.listing_id = _listing_id
      AND nr.contact_method = _contact_method
      AND nr.created_at > pg_catalog.now() - INTERVAL '24 hours'
      AND CASE
        WHEN nr.contact_method = 'email'
          THEN pg_catalog.lower(pg_catalog.btrim(nr.contact_value))
        ELSE pg_catalog.regexp_replace(nr.contact_value, '[^0-9]', '', 'g')
      END = v_normalized_contact
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'The request limit has been reached.';
  END IF;

  INSERT INTO public.notify_requests (
    listing_id,
    customer_id,
    contact_method,
    contact_value
  )
  VALUES (
    _listing_id,
    NULL,
    _contact_method,
    v_contact
  );
END;
$$;

REVOKE ALL ON FUNCTION public.request_listing_availability(
  uuid,
  public.notify_contact_method,
  text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.request_listing_availability(
  uuid,
  public.notify_contact_method,
  text
) TO anon, authenticated;

COMMENT ON FUNCTION public.request_listing_availability(
  uuid,
  public.notify_contact_method,
  text
) IS
  'Records a limited availability request for an approved shop''s sold-out item. Does not send notifications.';

COMMIT;
