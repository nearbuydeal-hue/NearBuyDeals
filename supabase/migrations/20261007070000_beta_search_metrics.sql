BEGIN;

CREATE TABLE public.search_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT pg_catalog.now()
);

ALTER TABLE public.search_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.search_events
  FROM PUBLIC, anon, authenticated;
GRANT INSERT ON TABLE public.search_events TO anon, authenticated;
GRANT SELECT ON TABLE public.search_events TO authenticated;

CREATE POLICY search_events_insert_public
  ON public.search_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY search_events_select_admin
  ON public.search_events
  FOR SELECT
  TO authenticated
  USING (private.has_role('admin'));

CREATE FUNCTION public.record_public_search()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  INSERT INTO public.search_events DEFAULT VALUES;
$$;

REVOKE ALL ON FUNCTION public.record_public_search()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_public_search()
  TO anon, authenticated;

CREATE FUNCTION public.get_admin_search_count(_period text)
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

  SELECT pg_catalog.count(*)::integer
  INTO v_count
  FROM public.search_events
  WHERE created_at >= v_since;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_search_count(text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_search_count(text)
  TO authenticated;

COMMENT ON TABLE public.search_events IS
  'Stores search submission timestamps only; search terms and area values are not persisted.';

COMMIT;
