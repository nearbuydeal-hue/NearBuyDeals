BEGIN;

ALTER TABLE public.listings
  ADD COLUMN sold_out_at timestamptz,
  ADD COLUMN reported_money_saved numeric(12, 2),
  ADD CONSTRAINT listings_reported_money_saved_check
    CHECK (
      reported_money_saved IS NULL
      OR (
        reported_money_saved >= 0
        AND reported_money_saved <> 'NaN'::numeric
      )
    ),
  ADD CONSTRAINT listings_reported_money_saved_sold_check
    CHECK (reported_money_saved IS NULL OR sold_out_at IS NOT NULL);

UPDATE public.listings
SET sold_out_at = updated_at
WHERE status = 'sold_out'
  AND sold_out_at IS NULL;

CREATE INDEX shops_created_status_idx
  ON public.shops (created_at, approval_status);
CREATE INDEX listings_created_status_idx
  ON public.listings (created_at, status);
CREATE INDEX listings_sold_out_at_idx
  ON public.listings (sold_out_at)
  WHERE sold_out_at IS NOT NULL;
CREATE INDEX shop_contacts_created_type_idx
  ON public.shop_contacts (created_at, contact_type);
CREATE INDEX notify_requests_created_idx
  ON public.notify_requests (created_at);

COMMENT ON COLUMN public.listings.reported_money_saved IS
  'Optional INR amount reported by the shop owner; not independently verified.';

CREATE FUNCTION private.track_listing_sold_out()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'sold_out' THEN
      NEW.sold_out_at := pg_catalog.now();
    END IF;

    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE'
     AND NEW.reported_money_saved IS DISTINCT FROM OLD.reported_money_saved
     AND NEW.reported_money_saved IS NOT NULL
     AND NEW.status <> 'sold_out'
  THEN
    RAISE EXCEPTION USING
      ERRCODE = 'check_violation',
      MESSAGE = 'Reported savings may only be entered for a sold-out listing.';
  END IF;

  IF NEW.status = 'sold_out'
     AND OLD.status IS DISTINCT FROM 'sold_out'
  THEN
    NEW.sold_out_at := pg_catalog.now();
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER listings_track_sold_out
  BEFORE INSERT OR UPDATE
  ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION private.track_listing_sold_out();

REVOKE ALL ON FUNCTION private.track_listing_sold_out()
  FROM PUBLIC, anon, authenticated;

GRANT SELECT (sold_out_at, reported_money_saved)
  ON public.listings TO authenticated;
GRANT UPDATE (reported_money_saved)
  ON public.listings TO authenticated;

CREATE FUNCTION public.get_my_shop_metrics(_period text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := (SELECT auth.uid());
  v_shop_id uuid;
  v_since timestamptz;
  v_metrics jsonb;
BEGIN
  IF v_user_id IS NULL OR NOT private.has_role('shop_owner') THEN
    RAISE EXCEPTION USING
      ERRCODE = 'insufficient_privilege',
      MESSAGE = 'Shop-owner access is required.';
  END IF;

  IF _period IS NULL OR _period NOT IN ('7d', '30d', 'all') THEN
    RAISE EXCEPTION USING
      ERRCODE = 'invalid_parameter_value',
      MESSAGE = 'The requested metrics period is invalid.';
  END IF;

  v_since := CASE _period
    WHEN '7d' THEN pg_catalog.now() - INTERVAL '7 days'
    WHEN '30d' THEN pg_catalog.now() - INTERVAL '30 days'
    ELSE '-infinity'::timestamptz
  END;

  SELECT s.id
  INTO v_shop_id
  FROM public.shops AS s
  WHERE s.owner_id = v_user_id;

  IF v_shop_id IS NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = 'no_data_found',
      MESSAGE = 'The shop could not be found.';
  END IF;

  SELECT pg_catalog.jsonb_build_object(
    'totalListings',
      pg_catalog.count(*) FILTER (WHERE l.created_at >= v_since),
    'activeListings',
      pg_catalog.count(*) FILTER (
        WHERE l.created_at >= v_since AND l.status = 'active'
      ),
    'soldOutListings',
      pg_catalog.count(*) FILTER (
        WHERE l.created_at >= v_since AND l.status = 'sold_out'
      ),
    'expiredListings',
      pg_catalog.count(*) FILTER (
        WHERE l.created_at >= v_since AND l.status = 'expired'
      ),
    'removedListings',
      pg_catalog.count(*) FILTER (
        WHERE l.created_at >= v_since AND l.status = 'removed'
      ),
    'customerContacts',
      (
        SELECT pg_catalog.count(*)
        FROM public.shop_contacts AS sc
        WHERE sc.shop_id = v_shop_id
          AND sc.created_at >= v_since
      ),
    'phoneContacts',
      (
        SELECT pg_catalog.count(*)
        FROM public.shop_contacts AS sc
        WHERE sc.shop_id = v_shop_id
          AND sc.contact_type = 'phone'
          AND sc.created_at >= v_since
      ),
    'whatsappContacts',
      (
        SELECT pg_catalog.count(*)
        FROM public.shop_contacts AS sc
        WHERE sc.shop_id = v_shop_id
          AND sc.contact_type = 'whatsapp'
          AND sc.created_at >= v_since
      ),
    'notifyRequests',
      (
        SELECT pg_catalog.count(*)
        FROM public.notify_requests AS nr
        JOIN public.listings AS nl ON nl.id = nr.listing_id
        WHERE nl.shop_id = v_shop_id
          AND nr.created_at >= v_since
      ),
    'listingsMarkedSold',
      pg_catalog.count(*) FILTER (
        WHERE l.sold_out_at >= v_since
      ),
    'reportedMoneySaved',
      COALESCE(
        pg_catalog.sum(l.reported_money_saved) FILTER (
          WHERE l.sold_out_at >= v_since
        ),
        0
      )
  )
  INTO v_metrics
  FROM public.listings AS l
  WHERE l.shop_id = v_shop_id
    AND (
      l.created_at >= v_since
      OR l.sold_out_at >= v_since
    );

  RETURN v_metrics;
END;
$$;

CREATE FUNCTION public.get_admin_metrics(_period text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := (SELECT auth.uid());
  v_since timestamptz;
  v_metrics jsonb;
BEGIN
  IF v_user_id IS NULL OR NOT private.has_role('admin') THEN
    RAISE EXCEPTION USING
      ERRCODE = 'insufficient_privilege',
      MESSAGE = 'Admin access is required.';
  END IF;

  IF _period IS NULL OR _period NOT IN ('7d', '30d', 'all') THEN
    RAISE EXCEPTION USING
      ERRCODE = 'invalid_parameter_value',
      MESSAGE = 'The requested metrics period is invalid.';
  END IF;

  v_since := CASE _period
    WHEN '7d' THEN pg_catalog.now() - INTERVAL '7 days'
    WHEN '30d' THEN pg_catalog.now() - INTERVAL '30 days'
    ELSE '-infinity'::timestamptz
  END;

  SELECT pg_catalog.jsonb_build_object(
    'shops',
      pg_catalog.jsonb_build_object(
        'total',
          (SELECT pg_catalog.count(*) FROM public.shops AS s
           WHERE s.created_at >= v_since),
        'pending',
          (SELECT pg_catalog.count(*) FROM public.shops AS s
           WHERE s.created_at >= v_since AND s.approval_status = 'pending'),
        'approved',
          (SELECT pg_catalog.count(*) FROM public.shops AS s
           WHERE s.created_at >= v_since AND s.approval_status = 'approved'),
        'rejected',
          (SELECT pg_catalog.count(*) FROM public.shops AS s
           WHERE s.created_at >= v_since AND s.approval_status = 'rejected'),
        'suspended',
          (SELECT pg_catalog.count(*) FROM public.shops AS s
           WHERE s.created_at >= v_since AND s.approval_status = 'suspended')
      ),
    'listings',
      pg_catalog.jsonb_build_object(
        'total',
          (SELECT pg_catalog.count(*) FROM public.listings AS l
           WHERE l.created_at >= v_since),
        'active',
          (SELECT pg_catalog.count(*) FROM public.listings AS l
           WHERE l.created_at >= v_since AND l.status = 'active'),
        'soldOut',
          (SELECT pg_catalog.count(*) FROM public.listings AS l
           WHERE l.created_at >= v_since AND l.status = 'sold_out'),
        'expired',
          (SELECT pg_catalog.count(*) FROM public.listings AS l
           WHERE l.created_at >= v_since AND l.status = 'expired'),
        'removed',
          (SELECT pg_catalog.count(*) FROM public.listings AS l
           WHERE l.created_at >= v_since AND l.status = 'removed')
      ),
    'customerDemand',
      pg_catalog.jsonb_build_object(
        'phoneContacts',
          (SELECT pg_catalog.count(*) FROM public.shop_contacts AS sc
           WHERE sc.contact_type = 'phone' AND sc.created_at >= v_since),
        'whatsappContacts',
          (SELECT pg_catalog.count(*) FROM public.shop_contacts AS sc
           WHERE sc.contact_type = 'whatsapp' AND sc.created_at >= v_since),
        'totalContacts',
          (SELECT pg_catalog.count(*) FROM public.shop_contacts AS sc
           WHERE sc.created_at >= v_since),
        'notifyRequests',
          (SELECT pg_catalog.count(*) FROM public.notify_requests AS nr
           WHERE nr.created_at >= v_since)
      ),
    'outcomes',
      pg_catalog.jsonb_build_object(
        'listingsMarkedSold',
          (SELECT pg_catalog.count(*) FROM public.listings AS l
           WHERE l.sold_out_at >= v_since),
        'reportedMoneySaved',
          COALESCE(
            (SELECT pg_catalog.sum(l.reported_money_saved)
             FROM public.listings AS l
             WHERE l.sold_out_at >= v_since),
            0
          )
      ),
    'byShopType',
      (
        SELECT COALESCE(
          pg_catalog.jsonb_object_agg(
            types.shop_type::text,
            pg_catalog.jsonb_build_object(
              'shops',
                (SELECT pg_catalog.count(*) FROM public.shops AS s
                 WHERE s.shop_type = types.shop_type
                   AND s.created_at >= v_since),
              'listings',
                (SELECT pg_catalog.count(*) FROM public.listings AS l
                 JOIN public.shops AS s ON s.id = l.shop_id
                 WHERE s.shop_type = types.shop_type
                   AND l.created_at >= v_since),
              'activeListings',
                (SELECT pg_catalog.count(*) FROM public.listings AS l
                 JOIN public.shops AS s ON s.id = l.shop_id
                 WHERE s.shop_type = types.shop_type
                   AND l.created_at >= v_since
                   AND l.status = 'active'),
              'soldOutListings',
                (SELECT pg_catalog.count(*) FROM public.listings AS l
                 JOIN public.shops AS s ON s.id = l.shop_id
                 WHERE s.shop_type = types.shop_type
                   AND l.created_at >= v_since
                   AND l.status = 'sold_out'),
              'expiredListings',
                (SELECT pg_catalog.count(*) FROM public.listings AS l
                 JOIN public.shops AS s ON s.id = l.shop_id
                 WHERE s.shop_type = types.shop_type
                   AND l.created_at >= v_since
                   AND l.status = 'expired'),
              'removedListings',
                (SELECT pg_catalog.count(*) FROM public.listings AS l
                 JOIN public.shops AS s ON s.id = l.shop_id
                 WHERE s.shop_type = types.shop_type
                   AND l.created_at >= v_since
                   AND l.status = 'removed'),
              'phoneContacts',
                (SELECT pg_catalog.count(*) FROM public.shop_contacts AS sc
                 JOIN public.shops AS s ON s.id = sc.shop_id
                 WHERE s.shop_type = types.shop_type
                   AND sc.contact_type = 'phone'
                   AND sc.created_at >= v_since),
              'whatsappContacts',
                (SELECT pg_catalog.count(*) FROM public.shop_contacts AS sc
                 JOIN public.shops AS s ON s.id = sc.shop_id
                 WHERE s.shop_type = types.shop_type
                   AND sc.contact_type = 'whatsapp'
                   AND sc.created_at >= v_since),
              'notifyRequests',
                (SELECT pg_catalog.count(*) FROM public.notify_requests AS nr
                 JOIN public.listings AS l ON l.id = nr.listing_id
                 JOIN public.shops AS s ON s.id = l.shop_id
                 WHERE s.shop_type = types.shop_type
                   AND nr.created_at >= v_since),
              'listingsMarkedSold',
                (SELECT pg_catalog.count(*) FROM public.listings AS l
                 JOIN public.shops AS s ON s.id = l.shop_id
                 WHERE s.shop_type = types.shop_type
                   AND l.sold_out_at >= v_since),
              'reportedMoneySaved',
                COALESCE(
                  (SELECT pg_catalog.sum(l.reported_money_saved)
                   FROM public.listings AS l
                   JOIN public.shops AS s ON s.id = l.shop_id
                   WHERE s.shop_type = types.shop_type
                     AND l.sold_out_at >= v_since),
                  0
                )
            )
          ),
          '{}'::jsonb
        )
        FROM (
          VALUES
            ('pharmacy'::public.shop_type),
            ('grocery'::public.shop_type),
            ('restaurant'::public.shop_type)
        ) AS types(shop_type)
      )
  )
  INTO v_metrics;

  RETURN v_metrics;
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_shop_metrics(text)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_admin_metrics(text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_shop_metrics(text)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_metrics(text)
  TO authenticated;

COMMIT;
