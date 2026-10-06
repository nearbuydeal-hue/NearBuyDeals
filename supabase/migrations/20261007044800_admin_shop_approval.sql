BEGIN;

CREATE TABLE public.shop_approval_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL
    REFERENCES public.shops (id) ON DELETE CASCADE,
  admin_user_id uuid NOT NULL
    REFERENCES public.profiles (id) ON DELETE RESTRICT,
  previous_status public.shop_approval_status NOT NULL,
  new_status public.shop_approval_status NOT NULL,
  created_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  CONSTRAINT shop_approval_audit_status_changed_check
    CHECK (previous_status <> new_status)
);

CREATE INDEX shop_approval_audit_shop_created_idx
  ON public.shop_approval_audit (shop_id, created_at DESC);

ALTER TABLE public.shop_approval_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY shop_approval_audit_select_admin
  ON public.shop_approval_audit
  FOR SELECT
  TO authenticated
  USING (private.has_role('admin'));

REVOKE ALL ON TABLE public.shop_approval_audit
  FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.shop_approval_audit TO authenticated;
REVOKE UPDATE (approval_status)
  ON TABLE public.shops FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.set_shop_approval_status(
  _shop_id uuid,
  _status public.shop_approval_status
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_admin_id uuid := (SELECT auth.uid());
  v_current_status public.shop_approval_status;
BEGIN
  IF v_admin_id IS NULL OR NOT private.has_role('admin') THEN
    RAISE EXCEPTION USING
      ERRCODE = 'insufficient_privilege',
      MESSAGE = 'Only an authenticated admin can change shop approval.';
  END IF;

  SELECT s.approval_status
  INTO v_current_status
  FROM public.shops AS s
  WHERE s.id = _shop_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING
      ERRCODE = 'no_data_found',
      MESSAGE = 'The requested shop does not exist.';
  END IF;

  IF NOT (
    (v_current_status = 'pending' AND _status IN ('approved', 'rejected'))
    OR (v_current_status = 'approved' AND _status = 'suspended')
    OR (
      v_current_status IN ('rejected', 'suspended')
      AND _status = 'approved'
    )
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = 'invalid_parameter_value',
      MESSAGE = 'The requested shop approval transition is not allowed.';
  END IF;

  UPDATE public.shops
  SET approval_status = _status
  WHERE id = _shop_id;

  INSERT INTO public.shop_approval_audit (
    shop_id,
    admin_user_id,
    previous_status,
    new_status
  )
  VALUES (
    _shop_id,
    v_admin_id,
    v_current_status,
    _status
  );
END;
$$;

REVOKE ALL ON FUNCTION public.set_shop_approval_status(
  uuid,
  public.shop_approval_status
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_shop_approval_status(
  uuid,
  public.shop_approval_status
) TO authenticated;

COMMIT;
