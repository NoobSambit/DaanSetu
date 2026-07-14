-- Migration 034: integer-paise CSR campaigns and PayPal match settlement.

ALTER TABLE public.corporate_campaigns
  ADD COLUMN IF NOT EXISTS goal_paise BIGINT,
  ADD COLUMN IF NOT EXISTS raised_paise BIGINT NOT NULL DEFAULT 0;

UPDATE public.corporate_campaigns
SET goal_paise = ROUND(goal_amount * 100)::BIGINT,
    raised_paise = ROUND(current_amount * 100)::BIGINT
WHERE goal_paise IS NULL;

ALTER TABLE public.corporate_campaigns
  ALTER COLUMN goal_paise SET NOT NULL,
  DROP CONSTRAINT IF EXISTS corporate_campaigns_goal_paise_positive,
  ADD CONSTRAINT corporate_campaigns_goal_paise_positive
    CHECK (goal_paise > 0),
  DROP CONSTRAINT IF EXISTS corporate_campaigns_raised_paise_nonnegative,
  ADD CONSTRAINT corporate_campaigns_raised_paise_nonnegative
    CHECK (raised_paise >= 0);

ALTER TABLE public.csr_initiatives
  ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.campaigns(id);

ALTER TABLE public.payment_orders
  ADD COLUMN IF NOT EXISTS csr_initiative_id UUID
    REFERENCES public.csr_initiatives(id),
  ADD COLUMN IF NOT EXISTS corporate_employee_id UUID
    REFERENCES public.corporate_employees(id);

ALTER TABLE public.csr_settlements
  ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'paypal',
  ADD COLUMN IF NOT EXISTS provider_amount_cents BIGINT;

UPDATE public.csr_settlements
SET provider_amount_cents = amount_paise
WHERE provider_amount_cents IS NULL;

ALTER TABLE public.csr_settlements
  ALTER COLUMN provider_amount_cents SET NOT NULL,
  DROP CONSTRAINT IF EXISTS csr_settlements_provider_amount_positive,
  ADD CONSTRAINT csr_settlements_provider_amount_positive
    CHECK (provider_amount_cents > 0);

ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS is_csr_match BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS corporate_id UUID
    REFERENCES public.corporate_profiles(id);

ALTER TABLE public.csr_match_pledges
  ADD COLUMN IF NOT EXISTS allocated_donation_id UUID UNIQUE
    REFERENCES public.donations(id);

CREATE OR REPLACE FUNCTION public.attach_csr_donation_attribution()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.gateway_order_id IS NOT NULL THEN
    SELECT payment_orders.csr_initiative_id,
           payment_orders.corporate_employee_id
    INTO NEW.csr_initiative_id, NEW.corporate_employee_id
    FROM public.payment_orders
    WHERE payment_orders.gateway_order_id = NEW.gateway_order_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS attach_csr_donation_attribution
  ON public.donations;
CREATE TRIGGER attach_csr_donation_attribution
BEFORE INSERT ON public.donations
FOR EACH ROW EXECUTE FUNCTION public.attach_csr_donation_attribution();

CREATE OR REPLACE FUNCTION public.create_csr_match_pledge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  initiative public.csr_initiatives;
  employee_total BIGINT;
  initiative_total BIGINT;
  matched BIGINT;
BEGIN
  IF NEW.status <> 'captured'
    OR NEW.is_demo
    OR NEW.csr_initiative_id IS NULL
    OR NEW.corporate_employee_id IS NULL
  THEN
    RETURN NEW;
  END IF;

  SELECT * INTO initiative
  FROM public.csr_initiatives
  WHERE id = NEW.csr_initiative_id;

  IF initiative.id IS NULL
    OR initiative.status <> 'active'
    OR NEW.captured_at NOT BETWEEN initiative.starts_at AND initiative.ends_at
    OR (
      initiative.campaign_id IS NOT NULL
      AND initiative.campaign_id IS DISTINCT FROM NEW.campaign_id
    )
    OR NOT EXISTS (
      SELECT 1
      FROM public.corporate_employees
      WHERE corporate_employees.id = NEW.corporate_employee_id
        AND corporate_employees.user_id = NEW.user_id
        AND corporate_employees.corporate_id = initiative.corporate_id
    )
  THEN
    RETURN NEW;
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(initiative.id::TEXT, 0)
  );

  SELECT COALESCE(SUM(matched_paise), 0)
  INTO employee_total
  FROM public.csr_match_pledges
  WHERE initiative_id = initiative.id
    AND employee_id = NEW.corporate_employee_id
    AND status NOT IN ('cancelled', 'reversed');

  SELECT COALESCE(SUM(matched_paise), 0)
  INTO initiative_total
  FROM public.csr_match_pledges
  WHERE initiative_id = initiative.id
    AND status NOT IN ('cancelled', 'reversed');

  matched := FLOOR(NEW.amount_paise * initiative.match_percent / 100.0);
  IF initiative.per_employee_cap_paise IS NOT NULL THEN
    matched := LEAST(
      matched,
      GREATEST(0, initiative.per_employee_cap_paise - employee_total)
    );
  END IF;
  IF initiative.initiative_cap_paise IS NOT NULL THEN
    matched := LEAST(
      matched,
      GREATEST(0, initiative.initiative_cap_paise - initiative_total)
    );
  END IF;

  IF matched > 0 THEN
    INSERT INTO public.csr_match_pledges (
      initiative_id,
      donation_id,
      employee_id,
      matched_paise
    )
    VALUES (
      initiative.id,
      NEW.id,
      NEW.corporate_employee_id,
      matched
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS public.create_csr_settlement_batch(
  UUID,
  UUID,
  UUID[],
  BIGINT,
  TEXT
);

CREATE OR REPLACE FUNCTION public.create_csr_settlement_batch(
  settlement_uuid UUID,
  corporate_uuid UUID,
  pledge_uuids UUID[],
  total_amount_paise BIGINT,
  provider_amount_cents BIGINT,
  provider_order_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  calculated BIGINT;
BEGIN
  IF provider_amount_cents <= 0 THEN
    RAISE EXCEPTION 'Invalid provider amount';
  END IF;

  PERFORM pledge.id
  FROM public.csr_match_pledges AS pledge
  JOIN public.csr_initiatives AS initiative
    ON initiative.id = pledge.initiative_id
  WHERE pledge.id = ANY(pledge_uuids)
    AND pledge.status = 'outstanding'
    AND initiative.corporate_id = corporate_uuid
  FOR UPDATE OF pledge;

  SELECT COALESCE(SUM(pledge.matched_paise), 0)
  INTO calculated
  FROM public.csr_match_pledges AS pledge
  JOIN public.csr_initiatives AS initiative
    ON initiative.id = pledge.initiative_id
  WHERE pledge.id = ANY(pledge_uuids)
    AND pledge.status = 'outstanding'
    AND initiative.corporate_id = corporate_uuid;

  IF calculated <> total_amount_paise OR calculated <= 0 THEN
    RAISE EXCEPTION 'CSR pledge total mismatch';
  END IF;

  INSERT INTO public.csr_settlements (
    id,
    corporate_id,
    amount_paise,
    provider_amount_cents,
    provider,
    gateway_order_id
  )
  VALUES (
    settlement_uuid,
    corporate_uuid,
    calculated,
    provider_amount_cents,
    'paypal',
    provider_order_id
  );

  INSERT INTO public.csr_settlement_pledges (settlement_id, pledge_id)
  SELECT settlement_uuid, pledge.id
  FROM public.csr_match_pledges AS pledge
  WHERE pledge.id = ANY(pledge_uuids);

  UPDATE public.csr_match_pledges
  SET status = 'batched',
      updated_at = NOW()
  WHERE id = ANY(pledge_uuids);
END;
$$;

CREATE OR REPLACE FUNCTION public.capture_csr_settlement(
  provider_order_id TEXT,
  provider_payment_id TEXT,
  captured_amount_cents BIGINT,
  provider_payload JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  settlement public.csr_settlements;
  pledge_record RECORD;
  original_donation public.donations;
  allocated_id UUID;
BEGIN
  SELECT * INTO settlement
  FROM public.csr_settlements
  WHERE gateway_order_id = provider_order_id
  FOR UPDATE;

  IF settlement.id IS NULL THEN
    RAISE EXCEPTION 'Unknown CSR settlement';
  END IF;
  IF settlement.status = 'captured' THEN
    RETURN settlement.id;
  END IF;
  IF settlement.status <> 'created' THEN
    RAISE EXCEPTION 'CSR settlement is not capturable';
  END IF;
  IF settlement.provider_amount_cents <> captured_amount_cents THEN
    RAISE EXCEPTION 'CSR provider amount mismatch';
  END IF;

  UPDATE public.csr_settlements
  SET status = 'captured',
      gateway_payment_id = provider_payment_id,
      settled_at = NOW(),
      updated_at = NOW()
  WHERE id = settlement.id;

  FOR pledge_record IN
    SELECT pledge.*
    FROM public.csr_match_pledges AS pledge
    JOIN public.csr_settlement_pledges AS batch
      ON batch.pledge_id = pledge.id
    WHERE batch.settlement_id = settlement.id
      AND pledge.status = 'batched'
    FOR UPDATE OF pledge
  LOOP
    SELECT * INTO original_donation
    FROM public.donations
    WHERE id = pledge_record.donation_id;

    INSERT INTO public.donations (
      user_id,
      ngo_id,
      campaign_id,
      amount,
      amount_paise,
      cause,
      is_anonymous,
      payment_status,
      status,
      gateway_order_id,
      gateway_payment_id,
      captured_at,
      receipt_number,
      metadata,
      provider,
      is_demo,
      is_csr_match,
      corporate_id
    )
    VALUES (
      original_donation.user_id,
      original_donation.ngo_id,
      original_donation.campaign_id,
      pledge_record.matched_paise::NUMERIC / 100,
      pledge_record.matched_paise,
      original_donation.cause,
      FALSE,
      'completed',
      'captured',
      'csr:' || settlement.id::TEXT || ':' || pledge_record.id::TEXT,
      provider_payment_id || ':' || pledge_record.id::TEXT,
      NOW(),
      'DS-CSR-' || UPPER(
        SUBSTRING(REPLACE(gen_random_uuid()::TEXT, '-', '') FROM 1 FOR 12)
      ),
      provider_payload || jsonb_build_object(
        'csrSettlementId', settlement.id,
        'csrPledgeId', pledge_record.id,
        'originalDonationId', original_donation.id
      ),
      'paypal',
      FALSE,
      TRUE,
      settlement.corporate_id
    )
    RETURNING id INTO allocated_id;

    UPDATE public.csr_match_pledges
    SET status = 'settled',
        allocated_donation_id = allocated_id,
        updated_at = NOW()
    WHERE id = pledge_record.id;

    UPDATE public.campaigns
    SET raised_paise = raised_paise + pledge_record.matched_paise,
        current_amount = current_amount
          + (pledge_record.matched_paise::NUMERIC / 100),
        updated_at = NOW()
    WHERE id = original_donation.campaign_id;
  END LOOP;

  RETURN settlement.id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_csr_settlement_batch(
  UUID,
  UUID,
  UUID[],
  BIGINT,
  BIGINT,
  TEXT
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_csr_settlement_batch(
  UUID,
  UUID,
  UUID[],
  BIGINT,
  BIGINT,
  TEXT
) TO service_role;

REVOKE ALL ON FUNCTION public.capture_csr_settlement(
  TEXT,
  TEXT,
  BIGINT,
  JSONB
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.capture_csr_settlement(
  TEXT,
  TEXT,
  BIGINT,
  JSONB
) TO service_role;

REVOKE ALL ON FUNCTION public.attach_csr_donation_attribution() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_csr_match_pledge() FROM PUBLIC;
