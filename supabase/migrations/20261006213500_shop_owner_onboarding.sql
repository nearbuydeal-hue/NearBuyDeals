BEGIN;

CREATE UNIQUE INDEX shops_one_per_owner_idx
  ON public.shops (owner_id);

CREATE FUNCTION public.complete_shop_owner_signup(
  _full_name text,
  _phone text,
  _shop_name text,
  _shop_type public.shop_type,
  _whatsapp text,
  _address text,
  _area text,
  _city text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := (SELECT auth.uid());
  v_role public.app_role;
  v_shop_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = 'insufficient_privilege',
      MESSAGE = 'An authenticated user is required.';
  END IF;

  IF _full_name IS NULL OR char_length(pg_catalog.btrim(_full_name))
       NOT BETWEEN 1 AND 120
     OR _phone IS NULL OR char_length(pg_catalog.btrim(_phone))
       NOT BETWEEN 7 AND 32
     OR _shop_name IS NULL OR char_length(pg_catalog.btrim(_shop_name))
       NOT BETWEEN 1 AND 120
     OR _whatsapp IS NOT NULL
       AND char_length(pg_catalog.btrim(_whatsapp)) NOT BETWEEN 7 AND 32
     OR _address IS NULL OR char_length(pg_catalog.btrim(_address))
       NOT BETWEEN 1 AND 300
     OR _area IS NULL OR char_length(pg_catalog.btrim(_area))
       NOT BETWEEN 1 AND 120
     OR _city IS NULL OR char_length(pg_catalog.btrim(_city))
       NOT BETWEEN 1 AND 120
  THEN
    RAISE EXCEPTION USING
      ERRCODE = 'check_violation',
      MESSAGE = 'Shop owner signup details are invalid.';
  END IF;

  SELECT p.role
  INTO v_role
  FROM public.profiles AS p
  WHERE p.id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING
      ERRCODE = 'no_data_found',
      MESSAGE = 'The authenticated user profile does not exist.';
  END IF;

  IF v_role NOT IN ('customer', 'shop_owner') THEN
    RAISE EXCEPTION USING
      ERRCODE = 'insufficient_privilege',
      MESSAGE = 'This account cannot be used for shop owner signup.';
  END IF;

  UPDATE public.profiles
  SET full_name = pg_catalog.btrim(_full_name),
      phone = pg_catalog.btrim(_phone),
      role = 'shop_owner'
  WHERE id = v_user_id;

  INSERT INTO public.shops (
    owner_id,
    name,
    shop_type,
    phone,
    whatsapp,
    address,
    area,
    city,
    approval_status
  )
  VALUES (
    v_user_id,
    pg_catalog.btrim(_shop_name),
    _shop_type,
    pg_catalog.btrim(_phone),
    NULLIF(pg_catalog.btrim(_whatsapp), ''),
    pg_catalog.btrim(_address),
    pg_catalog.btrim(_area),
    pg_catalog.btrim(_city),
    'pending'
  )
  ON CONFLICT (owner_id) DO NOTHING
  RETURNING id INTO v_shop_id;

  IF v_shop_id IS NULL THEN
    SELECT s.id
    INTO v_shop_id
    FROM public.shops AS s
    WHERE s.owner_id = v_user_id;
  END IF;

  RETURN v_shop_id;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_shop_owner_signup(
  text,
  text,
  text,
  public.shop_type,
  text,
  text,
  text,
  text
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.complete_shop_owner_signup(
  text,
  text,
  text,
  public.shop_type,
  text,
  text,
  text,
  text
) TO authenticated;

COMMENT ON FUNCTION public.complete_shop_owner_signup(
  text,
  text,
  text,
  public.shop_type,
  text,
  text,
  text,
  text
) IS
  'Authenticated self-service onboarding: promotes only the caller to shop_owner and creates their one pending shop. It accepts no role, owner ID, or approval status.';

COMMIT;
