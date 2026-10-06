BEGIN;

CREATE UNIQUE INDEX shops_one_per_owner_idx
  ON public.shops (owner_id);

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_phone_format_check
  CHECK (
    phone IS NULL
    OR (
      char_length(pg_catalog.btrim(phone)) BETWEEN 7 AND 32
      AND pg_catalog.btrim(phone) ~ '^[+]?[0-9(). -]+$'
      AND char_length(
        pg_catalog.regexp_replace(phone, '[^0-9]', '', 'g')
      ) BETWEEN 7 AND 15
    )
  ) NOT VALID;

ALTER TABLE public.shops
  ADD CONSTRAINT shops_phone_format_check
  CHECK (
    char_length(pg_catalog.btrim(phone)) BETWEEN 7 AND 32
    AND pg_catalog.btrim(phone) ~ '^[+]?[0-9(). -]+$'
    AND char_length(
      pg_catalog.regexp_replace(phone, '[^0-9]', '', 'g')
    ) BETWEEN 7 AND 15
  ) NOT VALID,
  ADD CONSTRAINT shops_whatsapp_format_check
  CHECK (
    whatsapp IS NULL
    OR (
      char_length(pg_catalog.btrim(whatsapp)) BETWEEN 7 AND 32
      AND pg_catalog.btrim(whatsapp) ~ '^[+]?[0-9(). -]+$'
      AND char_length(
        pg_catalog.regexp_replace(whatsapp, '[^0-9]', '', 'g')
      ) BETWEEN 7 AND 15
    )
  ) NOT VALID;

CREATE FUNCTION public.get_my_shop_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT s.id
  FROM public.shops AS s
  JOIN public.profiles AS p ON p.id = s.owner_id
  WHERE s.owner_id = (SELECT auth.uid())
    AND p.role = 'shop_owner'
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_my_shop_id()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_shop_id() TO authenticated;

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
     OR pg_catalog.btrim(_phone) !~ '^[+]?[0-9(). -]+$'
     OR char_length(
       pg_catalog.regexp_replace(_phone, '[^0-9]', '', 'g')
     ) NOT BETWEEN 7 AND 15
     OR _shop_name IS NULL OR char_length(pg_catalog.btrim(_shop_name))
       NOT BETWEEN 1 AND 120
     OR _whatsapp IS NULL
       OR char_length(pg_catalog.btrim(_whatsapp)) NOT BETWEEN 7 AND 32
     OR pg_catalog.btrim(_whatsapp) !~ '^[+]?[0-9(). -]+$'
     OR char_length(
       pg_catalog.regexp_replace(_whatsapp, '[^0-9]', '', 'g')
     ) NOT BETWEEN 7 AND 15
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

CREATE FUNCTION public.update_my_shop_owner_details(
  _full_name text,
  _phone text,
  _shop_name text,
  _shop_type public.shop_type,
  _whatsapp text,
  _address text,
  _area text,
  _city text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := (SELECT auth.uid());
  v_role public.app_role;
  v_updated_shop_id uuid;
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
     OR pg_catalog.btrim(_phone) !~ '^[+]?[0-9(). -]+$'
     OR char_length(
       pg_catalog.regexp_replace(_phone, '[^0-9]', '', 'g')
     ) NOT BETWEEN 7 AND 15
     OR _shop_name IS NULL OR char_length(pg_catalog.btrim(_shop_name))
       NOT BETWEEN 1 AND 120
     OR _whatsapp IS NULL
       OR char_length(pg_catalog.btrim(_whatsapp)) NOT BETWEEN 7 AND 32
     OR pg_catalog.btrim(_whatsapp) !~ '^[+]?[0-9(). -]+$'
     OR char_length(
       pg_catalog.regexp_replace(_whatsapp, '[^0-9]', '', 'g')
     ) NOT BETWEEN 7 AND 15
     OR _address IS NULL OR char_length(pg_catalog.btrim(_address))
       NOT BETWEEN 1 AND 300
     OR _area IS NULL OR char_length(pg_catalog.btrim(_area))
       NOT BETWEEN 1 AND 120
     OR _city IS NULL OR char_length(pg_catalog.btrim(_city))
       NOT BETWEEN 1 AND 120
  THEN
    RAISE EXCEPTION USING
      ERRCODE = 'check_violation',
      MESSAGE = 'Shop owner details are invalid.';
  END IF;

  SELECT p.role
  INTO v_role
  FROM public.profiles AS p
  WHERE p.id = v_user_id
  FOR UPDATE;

  IF v_role IS DISTINCT FROM 'shop_owner' THEN
    RAISE EXCEPTION USING
      ERRCODE = 'insufficient_privilege',
      MESSAGE = 'Only a shop owner can update shop details.';
  END IF;

  UPDATE public.profiles
  SET full_name = pg_catalog.btrim(_full_name),
      phone = pg_catalog.btrim(_phone)
  WHERE id = v_user_id;

  UPDATE public.shops
  SET name = pg_catalog.btrim(_shop_name),
      shop_type = _shop_type,
      phone = pg_catalog.btrim(_phone),
      whatsapp = pg_catalog.btrim(_whatsapp),
      address = pg_catalog.btrim(_address),
      area = pg_catalog.btrim(_area),
      city = pg_catalog.btrim(_city)
  WHERE owner_id = v_user_id
  RETURNING id INTO v_updated_shop_id;

  IF v_updated_shop_id IS NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = 'no_data_found',
      MESSAGE = 'The shop owner does not have a shop to update.';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.update_my_shop_owner_details(
  text,
  text,
  text,
  public.shop_type,
  text,
  text,
  text,
  text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_my_shop_owner_details(
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
COMMENT ON FUNCTION public.update_my_shop_owner_details(
  text,
  text,
  text,
  public.shop_type,
  text,
  text,
  text,
  text
) IS
  'Atomically updates the caller profile contact details and own shop details. It accepts no role, owner ID, or approval status.';

COMMIT;
