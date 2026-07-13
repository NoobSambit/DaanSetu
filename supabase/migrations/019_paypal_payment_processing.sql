-- Migration 019: PayPal settlement records and isolated demo payments.

UPDATE public.ngo_verifications
SET verification_status = 'submitted'
WHERE verification_status = 'pending';
ALTER TABLE public.ngo_verifications
  DROP CONSTRAINT IF EXISTS ngo_verifications_verification_status_check,
  ADD CONSTRAINT ngo_verifications_verification_status_check CHECK (
    verification_status IN (
      'draft', 'submitted', 'changes_requested', 'verified', 'rejected', 'expired'
    )
  );

ALTER TABLE public.payment_orders
  ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'paypal',
  ADD COLUMN IF NOT EXISTS settlement_currency TEXT NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS settlement_amount_minor BIGINT,
  ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(18, 6),
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE public.payment_orders
SET settlement_amount_minor = amount_paise,
    exchange_rate = 1
WHERE settlement_amount_minor IS NULL;

ALTER TABLE public.payment_orders
  ALTER COLUMN settlement_amount_minor SET NOT NULL,
  ALTER COLUMN exchange_rate SET NOT NULL;

ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS receipt_number TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'paypal',
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check CHECK (
    type IN (
      'campaign_milestone', 'volunteer_accepted', 'badge_unlocked',
      'post_liked', 'post_commented', 'partnership_accepted',
      'donation_captured', 'subscription_changed', 'refund_changed',
      'campaign_decision', 'moderation_decision', 'csr_invitation'
    )
  );

CREATE OR REPLACE FUNCTION public.record_completed_payment(
  order_identifier TEXT,
  payment_identifier TEXT,
  credited_amount_paise BIGINT,
  provider_payload JSONB DEFAULT '{}',
  demo_payment BOOLEAN DEFAULT FALSE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  payment_order public.payment_orders;
  campaign_record public.campaigns;
  existing_donation UUID;
  donation_uuid UUID;
BEGIN
  SELECT id INTO existing_donation
  FROM public.donations
  WHERE gateway_payment_id = payment_identifier;
  IF existing_donation IS NOT NULL THEN RETURN existing_donation; END IF;

  SELECT * INTO payment_order FROM public.payment_orders
  WHERE gateway_order_id = order_identifier FOR UPDATE;
  IF payment_order.id IS NULL THEN RAISE EXCEPTION 'Unknown payment order'; END IF;
  IF payment_order.amount_paise <> credited_amount_paise THEN RAISE EXCEPTION 'Credited amount mismatch'; END IF;
  IF payment_order.is_demo IS DISTINCT FROM demo_payment THEN RAISE EXCEPTION 'Payment mode mismatch'; END IF;

  SELECT * INTO campaign_record FROM public.campaigns
  WHERE id = payment_order.campaign_id FOR UPDATE;

  INSERT INTO public.donations (
    user_id, ngo_id, campaign_id, amount, amount_paise, cause,
    is_anonymous, payment_status, status, gateway_order_id,
    gateway_payment_id, captured_at, receipt_number, metadata,
    provider, is_demo
  ) VALUES (
    payment_order.donor_id, campaign_record.ngo_id, campaign_record.id,
    credited_amount_paise::NUMERIC / 100, credited_amount_paise,
    CASE campaign_record.category
      WHEN 'health' THEN 'healthcare'
      WHEN 'food' THEN 'hunger'
      WHEN 'disaster' THEN 'disaster'
      WHEN 'education' THEN 'education'
      ELSE 'general'
    END,
    FALSE, 'completed', 'captured',
    order_identifier, payment_identifier, NOW(),
    CASE WHEN demo_payment THEN 'DEMO-' ELSE 'DS-' END ||
      UPPER(SUBSTRING(REPLACE(gen_random_uuid()::TEXT, '-', '') FROM 1 FOR 16)),
    provider_payload, payment_order.provider, demo_payment
  ) RETURNING id INTO donation_uuid;

  UPDATE public.payment_orders SET status = 'captured', updated_at = NOW()
  WHERE id = payment_order.id;

  IF demo_payment = FALSE THEN
    UPDATE public.campaigns
    SET raised_paise = raised_paise + credited_amount_paise,
        current_amount = current_amount + (credited_amount_paise::NUMERIC / 100),
        updated_at = NOW()
    WHERE id = campaign_record.id;
  END IF;

  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (
    payment_order.donor_id,
    'donation_captured',
    CASE WHEN demo_payment THEN 'Demo donation completed' ELSE 'Donation received' END,
    CASE WHEN demo_payment
      THEN 'This demonstration did not move real money or affect public totals.'
      ELSE 'Your verified PayPal donation was captured successfully.'
    END,
    '/dashboard/giving'
  );
  RETURN donation_uuid;
END;
$$;

REVOKE ALL ON FUNCTION public.record_completed_payment(TEXT, TEXT, BIGINT, JSONB, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_completed_payment(TEXT, TEXT, BIGINT, JSONB, BOOLEAN) TO service_role;

CREATE INDEX IF NOT EXISTS donations_real_captured
  ON public.donations (user_id, captured_at DESC)
  WHERE status = 'captured' AND is_demo = FALSE;
