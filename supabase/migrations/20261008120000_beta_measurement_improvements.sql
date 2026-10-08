BEGIN;

CREATE OR REPLACE FUNCTION public.get_my_shop_metrics(_period text)
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

  IF _period IS NULL OR _period NOT IN ('today', '7d', '30d', 'all') THEN
    RAISE EXCEPTION USING
      ERRCODE = 'invalid_parameter_value',
      MESSAGE = 'The requested metrics period is invalid.';
  END IF;

  v_since := CASE _period
    WHEN 'today' THEN date_trunc('day', pg_catalog.now())
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
    'successfulConnections',
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

CREATE OR REPLACE FUNCTION public.get_admin_metrics(_period text)
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

  IF _period IS NULL OR _period NOT IN ('today', '7d', '30d', 'all') THEN
    RAISE EXCEPTION USING
      ERRCODE = 'invalid_parameter_value',
      MESSAGE = 'The requested metrics period is invalid.';
  END IF;

  v_since := CASE _period
    WHEN 'today' THEN date_trunc('day', pg_catalog.now())
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
        'successfulConnections',
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

CREATE OR REPLACE FUNCTION public.get_admin_search_count(_period text)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_since timestamptz;
  v_count integer;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR NOT private.has_role('admin') THEN
    RAISE EXCEPTION USING
      ERRCODE = 'insufficient_privilege',
      MESSAGE = 'Admin access is required.';
  END IF;

  IF _period IS NULL OR _period NOT IN ('today', '7d', '30d', 'all') THEN
    RAISE EXCEPTION USING
      ERRCODE = 'invalid_parameter_value',
      MESSAGE = 'The requested metrics period is invalid.';
  END IF;

  v_since := CASE _period
    WHEN 'today' THEN date_trunc('day', pg_catalog.now())
    WHEN '7d' THEN pg_catalog.now() - INTERVAL '7 days'
    WHEN '30d' THEN pg_catalog.now() - INTERVAL '30 days'
    ELSE '-infinity'::timestamptz
  END;

  SELECT pg_catalog.count(*)::integer
  INTO v_count
  FROM public.search_events
  WHERE created_at >= v_since;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_shop_metrics(text)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_admin_metrics(text)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_admin_search_count(text)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_my_shop_metrics(text)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_metrics(text)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_search_count(text)
  TO authenticated;

COMMIT;
