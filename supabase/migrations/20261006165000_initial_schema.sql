BEGIN;

CREATE TYPE public.app_role AS ENUM ('customer', 'shop_owner', 'admin');
CREATE TYPE public.shop_type AS ENUM ('pharmacy', 'grocery', 'restaurant');
CREATE TYPE public.shop_approval_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'suspended'
);
CREATE TYPE public.listing_status AS ENUM (
  'active',
  'sold_out',
  'expired',
  'removed'
);
CREATE TYPE public.notify_contact_method AS ENUM ('phone', 'whatsapp', 'email');
CREATE TYPE public.notify_request_status AS ENUM (
  'pending',
  'fulfilled',
  'cancelled'
);
CREATE TYPE public.shop_contact_type AS ENUM ('phone', 'whatsapp');

CREATE SCHEMA private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO anon, authenticated;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name text CHECK (
    full_name IS NULL
    OR char_length(btrim(full_name)) BETWEEN 1 AND 120
  ),
  phone text CHECK (
    phone IS NULL
    OR char_length(btrim(phone)) BETWEEN 1 AND 32
  ),
  role public.app_role NOT NULL DEFAULT 'customer',
  created_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  updated_at timestamptz NOT NULL DEFAULT pg_catalog.now()
);

CREATE TABLE public.shops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid()
    REFERENCES public.profiles (id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 120),
  shop_type public.shop_type NOT NULL,
  description text CHECK (
    description IS NULL
    OR char_length(description) <= 2000
  ),
  phone text NOT NULL CHECK (char_length(btrim(phone)) BETWEEN 1 AND 32),
  whatsapp text CHECK (
    whatsapp IS NULL
    OR char_length(btrim(whatsapp)) BETWEEN 1 AND 32
  ),
  address text NOT NULL CHECK (char_length(btrim(address)) BETWEEN 1 AND 300),
  area text NOT NULL CHECK (char_length(btrim(area)) BETWEEN 1 AND 120),
  city text NOT NULL CHECK (char_length(btrim(city)) BETWEEN 1 AND 120),
  latitude double precision,
  longitude double precision,
  approval_status public.shop_approval_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  updated_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  CONSTRAINT shops_coordinates_check CHECK (
    (latitude IS NULL) = (longitude IS NULL)
    AND (
      latitude IS NULL
      OR (
        latitude BETWEEN -90 AND 90
        AND longitude BETWEEN -180 AND 180
      )
    )
  )
);

CREATE TABLE public.listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL
    REFERENCES public.shops (id) ON DELETE CASCADE,
  item_name text NOT NULL CHECK (
    char_length(btrim(item_name)) BETWEEN 1 AND 160
  ),
  description text CHECK (
    description IS NULL
    OR char_length(description) <= 2000
  ),
  category text CHECK (
    category IS NULL
    OR char_length(btrim(category)) BETWEEN 1 AND 80
  ),
  quantity numeric(12, 3) NOT NULL DEFAULT 1 CHECK (
    quantity > 0 AND quantity <> 'NaN'::numeric
  ),
  unit text NOT NULL DEFAULT 'item' CHECK (
    char_length(btrim(unit)) BETWEEN 1 AND 32
  ),
  price numeric(12, 2) CHECK (
    price IS NULL OR (price >= 0 AND price <> 'NaN'::numeric)
  ),
  expiry_date date,
  status public.listing_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  updated_at timestamptz NOT NULL DEFAULT pg_catalog.now()
);

CREATE TABLE public.notify_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES public.listings (id) ON DELETE CASCADE,
  customer_id uuid DEFAULT auth.uid()
    REFERENCES public.profiles (id) ON DELETE CASCADE,
  contact_method public.notify_contact_method NOT NULL,
  contact_value text NOT NULL CHECK (
    char_length(btrim(contact_value)) BETWEEN 1 AND 320
  ),
  status public.notify_request_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  fulfilled_at timestamptz,
  CONSTRAINT notify_requests_fulfilled_at_check CHECK (
    (status = 'fulfilled') = (fulfilled_at IS NOT NULL)
  )
);

CREATE TABLE public.shop_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL
    REFERENCES public.shops (id) ON DELETE CASCADE,
  listing_id uuid REFERENCES public.listings (id) ON DELETE SET NULL,
  contact_type public.shop_contact_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT pg_catalog.now()
);

CREATE INDEX shops_owner_id_idx ON public.shops (owner_id);
CREATE INDEX shops_city_area_approved_idx
  ON public.shops (lower(city), lower(area))
  WHERE approval_status = 'approved';
CREATE INDEX shops_type_approval_status_idx
  ON public.shops (shop_type, approval_status);

CREATE INDEX listings_shop_status_idx
  ON public.listings (shop_id, status);
CREATE INDEX listings_active_item_name_idx
  ON public.listings (lower(item_name))
  WHERE status = 'active';
CREATE INDEX listings_active_category_idx
  ON public.listings (lower(category))
  WHERE status = 'active' AND category IS NOT NULL;
CREATE INDEX listings_active_expiry_date_idx
  ON public.listings (expiry_date)
  WHERE status = 'active' AND expiry_date IS NOT NULL;

CREATE INDEX notify_requests_customer_created_idx
  ON public.notify_requests (customer_id, created_at DESC)
  WHERE customer_id IS NOT NULL;
CREATE INDEX notify_requests_listing_id_idx
  ON public.notify_requests (listing_id)
  WHERE listing_id IS NOT NULL;

CREATE INDEX shop_contacts_shop_created_idx
  ON public.shop_contacts (shop_id, created_at DESC);
CREATE INDEX shop_contacts_listing_id_idx
  ON public.shop_contacts (listing_id)
  WHERE listing_id IS NOT NULL;

CREATE FUNCTION private.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := pg_catalog.now();
  RETURN NEW;
END;
$$;

CREATE FUNCTION private.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_full_name text := NULLIF(
    pg_catalog.btrim(NEW.raw_user_meta_data ->> 'full_name'),
    ''
  );
  v_phone text := NULLIF(
    pg_catalog.btrim(NEW.raw_user_meta_data ->> 'phone'),
    ''
  );
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    CASE
      WHEN char_length(v_full_name) BETWEEN 1 AND 120 THEN v_full_name
      ELSE NULL
    END,
    CASE
      WHEN char_length(v_phone) BETWEEN 1 AND 32 THEN v_phone
      ELSE NULL
    END
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

INSERT INTO public.profiles (id, full_name, phone)
SELECT
  u.id,
  CASE
    WHEN char_length(pg_catalog.btrim(u.raw_user_meta_data ->> 'full_name'))
      BETWEEN 1 AND 120
    THEN pg_catalog.btrim(u.raw_user_meta_data ->> 'full_name')
    ELSE NULL
  END,
  CASE
    WHEN char_length(pg_catalog.btrim(u.raw_user_meta_data ->> 'phone'))
      BETWEEN 1 AND 32
    THEN pg_catalog.btrim(u.raw_user_meta_data ->> 'phone')
    ELSE NULL
  END
FROM auth.users AS u
ON CONFLICT (id) DO NOTHING;

CREATE FUNCTION private.has_role(_role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles AS p
    WHERE p.id = (SELECT auth.uid())
      AND p.role = _role
  );
$$;

CREATE FUNCTION private.owns_shop(_shop_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.shops AS s
    WHERE s.id = _shop_id
      AND s.owner_id = (SELECT auth.uid())
      AND EXISTS (
        SELECT 1
        FROM public.profiles AS p
        WHERE p.id = (SELECT auth.uid())
          AND p.role = 'shop_owner'
      )
  );
$$;

CREATE FUNCTION private.owns_approved_shop(_shop_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.shops AS s
    WHERE s.id = _shop_id
      AND s.owner_id = (SELECT auth.uid())
      AND s.approval_status = 'approved'
      AND EXISTS (
        SELECT 1
        FROM public.profiles AS p
        WHERE p.id = (SELECT auth.uid())
          AND p.role = 'shop_owner'
      )
  );
$$;

CREATE FUNCTION private.is_approved_shop(_shop_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.shops AS s
    WHERE s.id = _shop_id
      AND s.approval_status = 'approved'
  );
$$;

CREATE FUNCTION private.is_notifiable_listing(_listing_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.listings AS l
    JOIN public.shops AS s ON s.id = l.shop_id
    WHERE l.id = _listing_id
      AND s.approval_status = 'approved'
      AND (
        l.status IN ('sold_out', 'expired', 'removed')
        OR (l.expiry_date IS NOT NULL AND l.expiry_date < CURRENT_DATE)
      )
  );
$$;

CREATE FUNCTION private.can_record_shop_contact(
  _shop_id uuid,
  _listing_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.shops AS s
    WHERE s.id = _shop_id
      AND s.approval_status = 'approved'
      AND (
        _listing_id IS NULL
        OR EXISTS (
          SELECT 1
          FROM public.listings AS l
          WHERE l.id = _listing_id
            AND l.shop_id = s.id
            AND l.status = 'active'
            AND (l.expiry_date IS NULL OR l.expiry_date >= CURRENT_DATE)
        )
      )
  );
$$;

CREATE FUNCTION private.enforce_pharmacy_availability_only()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_shop_type public.shop_type;
BEGIN
  SELECT s.shop_type
  INTO v_shop_type
  FROM public.shops AS s
  WHERE s.id = NEW.shop_id
  FOR UPDATE;

  IF v_shop_type = 'pharmacy' AND NEW.price IS NOT NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = 'check_violation',
      MESSAGE = 'Pharmacy listings cannot include a price.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE FUNCTION private.prevent_priced_pharmacy_conversion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.shop_type = 'pharmacy'
     AND OLD.shop_type IS DISTINCT FROM NEW.shop_type
     AND EXISTS (
       SELECT 1
       FROM public.listings AS l
       WHERE l.shop_id = NEW.id
         AND l.price IS NOT NULL
     )
  THEN
    RAISE EXCEPTION USING
      ERRCODE = 'check_violation',
      MESSAGE = 'Remove listing prices before changing a shop to pharmacy.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE FUNCTION public.set_profile_role(
  _user_id uuid,
  _role public.app_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_rows_updated bigint;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR NOT private.has_role('admin') THEN
    RAISE EXCEPTION USING
      ERRCODE = 'insufficient_privilege',
      MESSAGE = 'Only an authenticated admin can change profile roles.';
  END IF;

  UPDATE public.profiles
  SET role = _role
  WHERE id = _user_id;

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
  IF v_rows_updated = 0 THEN
    RAISE EXCEPTION USING
      ERRCODE = 'no_data_found',
      MESSAGE = 'The requested profile does not exist.';
  END IF;
END;
$$;

CREATE FUNCTION public.set_shop_approval_status(
  _shop_id uuid,
  _status public.shop_approval_status
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_rows_updated bigint;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR NOT private.has_role('admin') THEN
    RAISE EXCEPTION USING
      ERRCODE = 'insufficient_privilege',
      MESSAGE = 'Only an authenticated admin can change shop approval.';
  END IF;

  UPDATE public.shops
  SET approval_status = _status
  WHERE id = _shop_id;

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
  IF v_rows_updated = 0 THEN
    RAISE EXCEPTION USING
      ERRCODE = 'no_data_found',
      MESSAGE = 'The requested shop does not exist.';
  END IF;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION private.handle_new_auth_user();

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION private.set_updated_at();

CREATE TRIGGER shops_set_updated_at
  BEFORE UPDATE ON public.shops
  FOR EACH ROW
  EXECUTE FUNCTION private.set_updated_at();

CREATE TRIGGER listings_set_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION private.set_updated_at();

CREATE TRIGGER listings_enforce_pharmacy_availability_insert
  BEFORE INSERT ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION private.enforce_pharmacy_availability_only();

CREATE TRIGGER listings_enforce_pharmacy_availability_update
  BEFORE UPDATE OF shop_id, price ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION private.enforce_pharmacy_availability_only();

CREATE TRIGGER shops_prevent_priced_pharmacy_conversion
  BEFORE UPDATE OF shop_type ON public.shops
  FOR EACH ROW
  EXECUTE FUNCTION private.prevent_priced_pharmacy_conversion();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notify_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_own
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = (SELECT auth.uid()));

CREATE POLICY profiles_select_admin
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (private.has_role('admin'));

CREATE POLICY profiles_update_own
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY shops_select_approved_public
  ON public.shops
  FOR SELECT
  TO anon, authenticated
  USING (approval_status = 'approved');

CREATE POLICY shops_select_owner
  ON public.shops
  FOR SELECT
  TO authenticated
  USING (private.owns_shop(id));

CREATE POLICY shops_select_admin
  ON public.shops
  FOR SELECT
  TO authenticated
  USING (private.has_role('admin'));

CREATE POLICY shops_insert_owner
  ON public.shops
  FOR INSERT
  TO authenticated
  WITH CHECK (
    private.has_role('shop_owner')
    AND owner_id = (SELECT auth.uid())
    AND approval_status = 'pending'
  );

CREATE POLICY shops_update_owner
  ON public.shops
  FOR UPDATE
  TO authenticated
  USING (private.owns_shop(id))
  WITH CHECK (private.owns_shop(id));

CREATE POLICY shops_update_admin
  ON public.shops
  FOR UPDATE
  TO authenticated
  USING (private.has_role('admin'))
  WITH CHECK (private.has_role('admin'));

CREATE POLICY shops_delete_admin
  ON public.shops
  FOR DELETE
  TO authenticated
  USING (private.has_role('admin'));

CREATE POLICY listings_select_active_public
  ON public.listings
  FOR SELECT
  TO anon, authenticated
  USING (
    status = 'active'
    AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE)
    AND private.is_approved_shop(shop_id)
  );

CREATE POLICY listings_select_owner
  ON public.listings
  FOR SELECT
  TO authenticated
  USING (private.owns_approved_shop(shop_id));

CREATE POLICY listings_select_admin
  ON public.listings
  FOR SELECT
  TO authenticated
  USING (private.has_role('admin'));

CREATE POLICY listings_insert_owner
  ON public.listings
  FOR INSERT
  TO authenticated
  WITH CHECK (private.owns_approved_shop(shop_id));

CREATE POLICY listings_update_owner
  ON public.listings
  FOR UPDATE
  TO authenticated
  USING (private.owns_approved_shop(shop_id))
  WITH CHECK (private.owns_approved_shop(shop_id));

CREATE POLICY listings_update_admin
  ON public.listings
  FOR UPDATE
  TO authenticated
  USING (private.has_role('admin'))
  WITH CHECK (private.has_role('admin'));

CREATE POLICY listings_delete_owner
  ON public.listings
  FOR DELETE
  TO authenticated
  USING (private.owns_approved_shop(shop_id));

CREATE POLICY listings_delete_admin
  ON public.listings
  FOR DELETE
  TO authenticated
  USING (private.has_role('admin'));

CREATE POLICY notify_requests_select_own
  ON public.notify_requests
  FOR SELECT
  TO authenticated
  USING (customer_id = (SELECT auth.uid()));

CREATE POLICY notify_requests_select_admin
  ON public.notify_requests
  FOR SELECT
  TO authenticated
  USING (private.has_role('admin'));

CREATE POLICY notify_requests_insert_own
  ON public.notify_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    customer_id IS NOT NULL
    AND customer_id = (SELECT auth.uid())
    AND status = 'pending'
    AND fulfilled_at IS NULL
    AND (
      listing_id IS NULL
      OR private.is_notifiable_listing(listing_id)
    )
  );

CREATE POLICY notify_requests_update_admin
  ON public.notify_requests
  FOR UPDATE
  TO authenticated
  USING (private.has_role('admin'))
  WITH CHECK (private.has_role('admin'));

CREATE POLICY notify_requests_delete_own
  ON public.notify_requests
  FOR DELETE
  TO authenticated
  USING (customer_id = (SELECT auth.uid()));

CREATE POLICY shop_contacts_insert_approved_shop
  ON public.shop_contacts
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (private.can_record_shop_contact(shop_id, listing_id));

COMMENT ON COLUMN public.listings.price IS
  'Optional display information for non-pharmacy stock only; this schema does not process sales or payments.';
COMMENT ON TABLE public.notify_requests IS
  'Stores notification requests only. No notification delivery is implemented by this schema.';
COMMENT ON TABLE public.shop_contacts IS
  'Stores contact intent without customer identity or contact details.';

REVOKE ALL ON TABLE public.profiles FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.shops FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.listings FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.notify_requests FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.shop_contacts FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE public.profiles TO authenticated;
GRANT UPDATE (full_name, phone)
  ON TABLE public.profiles TO authenticated;

GRANT SELECT (
  id,
  name,
  shop_type,
  description,
  phone,
  whatsapp,
  address,
  area,
  city,
  latitude,
  longitude,
  created_at,
  updated_at
)
  ON TABLE public.shops TO anon, authenticated;
GRANT SELECT (approval_status)
  ON TABLE public.shops TO authenticated;
GRANT INSERT (
  name,
  shop_type,
  description,
  phone,
  whatsapp,
  address,
  area,
  city,
  latitude,
  longitude
)
  ON TABLE public.shops TO authenticated;
GRANT UPDATE (
  name,
  shop_type,
  description,
  phone,
  whatsapp,
  address,
  area,
  city,
  latitude,
  longitude
)
  ON TABLE public.shops TO authenticated;
GRANT DELETE ON TABLE public.shops TO authenticated;

GRANT SELECT (
  id,
  shop_id,
  item_name,
  description,
  category,
  quantity,
  unit,
  price,
  expiry_date,
  status,
  created_at,
  updated_at
)
  ON TABLE public.listings TO anon, authenticated;
GRANT INSERT (
  shop_id,
  item_name,
  description,
  category,
  quantity,
  unit,
  price,
  expiry_date
)
  ON TABLE public.listings TO authenticated;
GRANT UPDATE (
  item_name,
  description,
  category,
  quantity,
  unit,
  price,
  expiry_date,
  status
)
  ON TABLE public.listings TO authenticated;
GRANT DELETE ON TABLE public.listings TO authenticated;

GRANT SELECT ON TABLE public.notify_requests TO authenticated;
GRANT INSERT (
  listing_id,
  contact_method,
  contact_value
)
  ON TABLE public.notify_requests TO authenticated;
GRANT UPDATE (status, fulfilled_at)
  ON TABLE public.notify_requests TO authenticated;
GRANT DELETE ON TABLE public.notify_requests TO authenticated;

GRANT INSERT (shop_id, listing_id, contact_type)
  ON TABLE public.shop_contacts TO anon, authenticated;

REVOKE ALL ON FUNCTION private.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.handle_new_auth_user()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.has_role(public.app_role)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.owns_shop(uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.owns_approved_shop(uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.is_approved_shop(uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.is_notifiable_listing(uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.can_record_shop_contact(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.enforce_pharmacy_availability_only()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.prevent_priced_pharmacy_conversion()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_profile_role(uuid, public.app_role)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_shop_approval_status(
  uuid,
  public.shop_approval_status
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION private.has_role(public.app_role)
  TO authenticated;
GRANT EXECUTE ON FUNCTION private.owns_shop(uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION private.owns_approved_shop(uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_approved_shop(uuid)
  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.is_notifiable_listing(uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION private.can_record_shop_contact(uuid, uuid)
  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_profile_role(uuid, public.app_role)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_shop_approval_status(
  uuid,
  public.shop_approval_status
) TO authenticated;

COMMIT;
