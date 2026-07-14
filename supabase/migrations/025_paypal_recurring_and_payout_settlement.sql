-- Migration 025: atomic recurring gifts and PayPal payout settlement.

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'paypal',
  ADD COLUMN IF NOT EXISTS settlement_currency TEXT NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS settlement_amount_minor BIGINT,
  ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(18, 6),
  ADD COLUMN IF NOT EXISTS cause TEXT NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.payment_orders
  ADD COLUMN IF NOT EXISTS cause TEXT NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.payment_orders
  DROP CONSTRAINT IF EXISTS payment_orders_cause_check,
  ADD CONSTRAINT payment_orders_cause_check CHECK (
    cause IN ('education', 'hunger', 'healthcare', 'disaster', 'general')
  );
ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_cause_check,
  ADD CONSTRAINT subscriptions_cause_check CHECK (
    cause IN ('education', 'hunger', 'healthcare', 'disaster', 'general')
  );

ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS subscription_id UUID
    REFERENCES public.subscriptions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS donations_subscription_idx
  ON public.donations (subscription_id, captured_at DESC)
  WHERE subscription_id IS NOT NULL;

ALTER TABLE public.payment_transfers
  ADD COLUMN IF NOT EXISTS settlement_currency TEXT NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS settlement_amount_minor BIGINT,
  ADD COLUMN IF NOT EXISTS sender_batch_id TEXT,
  ADD COLUMN IF NOT EXISTS sender_item_id TEXT,
  ADD COLUMN IF NOT EXISTS provider_batch_id TEXT,
  ADD COLUMN IF NOT EXISTS provider_item_id TEXT;

ALTER TABLE public.payment_transfers
  DROP CONSTRAINT IF EXISTS payment_transfers_status_check,
  ADD CONSTRAINT payment_transfers_status_check CHECK (
    status IN (
      'pending', 'claimed', 'created', 'processing', 'settled',
      'failed', 'held', 'unclaimed', 'reversed'
    )
  );

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check,
  ADD CONSTRAINT notifications_type_check CHECK (
    type IN (
      'campaign_milestone', 'volunteer_accepted', 'badge_unlocked',
      'post_liked', 'post_commented', 'partnership_accepted',
      'donation_captured', 'subscription_changed', 'refund_changed',
      'payout_changed', 'campaign_decision', 'moderation_decision',
      'csr_invitation'
    )
  );

CREATE UNIQUE INDEX IF NOT EXISTS payment_transfers_donation_unique
  ON public.payment_transfers (donation_id)
  WHERE donation_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS payment_transfers_sender_batch_unique
  ON public.payment_transfers (sender_batch_id)
  WHERE sender_batch_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS payment_transfers_sender_item_unique
  ON public.payment_transfers (sender_item_id)
  WHERE sender_item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS payment_transfers_provider_batch_idx
  ON public.payment_transfers (provider_batch_id)
  WHERE provider_batch_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS payment_transfers_provider_item_idx
  ON public.payment_transfers (provider_item_id)
  WHERE provider_item_id IS NOT NULL;

CREATE POLICY "Owners read payout transfers"
  ON public.payment_transfers FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.payout_accounts
      WHERE payout_accounts.id = payout_account_id
        AND payout_accounts.owner_id = auth.uid()
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
  IF existing_donation IS NOT NULL THEN
    RETURN existing_donation;
  END IF;

  SELECT * INTO payment_order
  FROM public.payment_orders
  WHERE gateway_order_id = order_identifier
  FOR UPDATE;

  IF payment_order.id IS NULL THEN
    RAISE EXCEPTION 'Unknown payment order';
  END IF;
  IF payment_order.amount_paise <> credited_amount_paise THEN
    RAISE EXCEPTION 'Credited amount mismatch';
  END IF;
  IF payment_order.is_demo IS DISTINCT FROM demo_payment THEN
    RAISE EXCEPTION 'Payment mode mismatch';
  END IF;

  SELECT * INTO campaign_record
  FROM public.campaigns
  WHERE id = payment_order.campaign_id
  FOR UPDATE;

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
    is_demo
  ) VALUES (
    payment_order.donor_id,
    campaign_record.ngo_id,
    campaign_record.id,
    credited_amount_paise::NUMERIC / 100,
    credited_amount_paise,
    payment_order.cause,
    payment_order.is_anonymous,
    'completed',
    'captured',
    order_identifier,
    payment_identifier,
    NOW(),
    CASE WHEN demo_payment THEN 'DEMO-' ELSE 'DS-' END || UPPER(
      SUBSTRING(REPLACE(gen_random_uuid()::TEXT, '-', '') FROM 1 FOR 16)
    ),
    provider_payload,
    payment_order.provider,
    demo_payment
  )
  RETURNING id INTO donation_uuid;

  UPDATE public.payment_orders
  SET status = 'captured', updated_at = NOW()
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
    CASE
      WHEN demo_payment THEN 'Demo donation completed'
      ELSE 'Donation received'
    END,
    CASE
      WHEN demo_payment
        THEN 'This demonstration did not move real money or affect public totals.'
      ELSE 'Your verified PayPal donation was captured successfully.'
    END,
    '/dashboard/giving'
  );

  RETURN donation_uuid;
END;
$$;

REVOKE ALL ON FUNCTION public.record_completed_payment(
  TEXT,
  TEXT,
  BIGINT,
  JSONB,
  BOOLEAN
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_completed_payment(
  TEXT,
  TEXT,
  BIGINT,
  JSONB,
  BOOLEAN
) TO service_role;

CREATE OR REPLACE FUNCTION public.record_completed_subscription_payment(
  subscription_identifier TEXT,
  payment_identifier TEXT,
  received_settlement_minor BIGINT,
  provider_payload JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  subscription_record public.subscriptions;
  campaign_record public.campaigns;
  existing_donation UUID;
  donation_uuid UUID;
BEGIN
  SELECT id INTO existing_donation
  FROM public.donations
  WHERE gateway_payment_id = payment_identifier;
  IF existing_donation IS NOT NULL THEN
    RETURN existing_donation;
  END IF;

  SELECT * INTO subscription_record
  FROM public.subscriptions
  WHERE gateway_subscription_id = subscription_identifier
  FOR UPDATE;

  IF subscription_record.id IS NULL THEN
    RAISE EXCEPTION 'Subscription not found';
  END IF;
  IF subscription_record.status NOT IN ('active', 'authenticated') THEN
    RAISE EXCEPTION 'Subscription is not active';
  END IF;
  IF subscription_record.settlement_amount_minor IS NULL
     OR subscription_record.settlement_amount_minor <> received_settlement_minor THEN
    RAISE EXCEPTION 'Subscription settlement amount mismatch';
  END IF;

  SELECT * INTO campaign_record
  FROM public.campaigns
  WHERE id = subscription_record.campaign_id
  FOR UPDATE;

  IF campaign_record.id IS NULL THEN
    RAISE EXCEPTION 'Campaign not found';
  END IF;

  INSERT INTO public.subscription_invoices (
    subscription_id,
    gateway_invoice_id,
    gateway_payment_id,
    amount_paise,
    status,
    issued_at,
    paid_at
  ) VALUES (
    subscription_record.id,
    payment_identifier,
    payment_identifier,
    subscription_record.amount_paise,
    'paid',
    NOW(),
    NOW()
  )
  ON CONFLICT (gateway_invoice_id) DO NOTHING;

  INSERT INTO public.donations (
    user_id,
    ngo_id,
    campaign_id,
    subscription_id,
    amount,
    amount_paise,
    cause,
    is_anonymous,
    payment_status,
    status,
    gateway_payment_id,
    captured_at,
    receipt_number,
    metadata,
    provider,
    is_demo
  ) VALUES (
    subscription_record.donor_id,
    campaign_record.ngo_id,
    campaign_record.id,
    subscription_record.id,
    subscription_record.amount_paise::NUMERIC / 100,
    subscription_record.amount_paise,
    subscription_record.cause,
    subscription_record.is_anonymous,
    'completed',
    'captured',
    payment_identifier,
    NOW(),
    'DS-' || UPPER(
      SUBSTRING(REPLACE(gen_random_uuid()::TEXT, '-', '') FROM 1 FOR 16)
    ),
    provider_payload,
    subscription_record.provider,
    FALSE
  )
  RETURNING id INTO donation_uuid;

  UPDATE public.campaigns
  SET raised_paise = raised_paise + subscription_record.amount_paise,
      current_amount = current_amount + (
        subscription_record.amount_paise::NUMERIC / 100
      ),
      updated_at = NOW()
  WHERE id = campaign_record.id;

  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (
    subscription_record.donor_id,
    'donation_captured',
    'Recurring donation received',
    'Your verified PayPal recurring donation was captured successfully.',
    '/dashboard/giving'
  );

  RETURN donation_uuid;
END;
$$;

REVOKE ALL ON FUNCTION public.record_completed_subscription_payment(
  TEXT,
  TEXT,
  BIGINT,
  JSONB
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_completed_subscription_payment(
  TEXT,
  TEXT,
  BIGINT,
  JSONB
) TO service_role;

CREATE OR REPLACE FUNCTION public.claim_paypal_payout_transfer(
  donation_uuid UUID,
  settlement_minor BIGINT
)
RETURNS public.payment_transfers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  donation_record public.donations;
  campaign_record public.campaigns;
  payout_record public.payout_accounts;
  transfer_record public.payment_transfers;
BEGIN
  IF settlement_minor <= 0 THEN
    RAISE EXCEPTION 'Invalid payout settlement amount';
  END IF;

  SELECT * INTO donation_record
  FROM public.donations
  WHERE id = donation_uuid
  FOR UPDATE;

  IF donation_record.id IS NULL
     OR donation_record.is_demo
     OR donation_record.status <> 'captured'
     OR donation_record.refunded_paise <> 0 THEN
    RAISE EXCEPTION 'Donation is not eligible for payout';
  END IF;

  SELECT * INTO campaign_record
  FROM public.campaigns
  WHERE id = donation_record.campaign_id
  FOR UPDATE;

  SELECT * INTO payout_record
  FROM public.payout_accounts
  WHERE id = campaign_record.payout_account_id
  FOR UPDATE;

  IF payout_record.id IS NULL OR payout_record.status <> 'active' THEN
    RAISE EXCEPTION 'Payout account is not active';
  END IF;

  INSERT INTO public.payment_transfers (
    donation_id,
    payout_account_id,
    amount_paise,
    settlement_currency,
    settlement_amount_minor,
    sender_batch_id,
    sender_item_id,
    status
  ) VALUES (
    donation_record.id,
    payout_record.id,
    donation_record.amount_paise,
    'USD',
    settlement_minor,
    'DS-BATCH-' || donation_record.id::TEXT,
    'DS-ITEM-' || donation_record.id::TEXT,
    'claimed'
  )
  RETURNING * INTO transfer_record;

  RETURN transfer_record;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_paypal_payout_transfer(UUID, BIGINT)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_paypal_payout_transfer(UUID, BIGINT)
  TO service_role;

CREATE OR REPLACE FUNCTION public.reconcile_paypal_payout_transfer(
  sender_batch_identifier TEXT,
  sender_item_identifier TEXT,
  provider_batch_identifier TEXT,
  provider_item_identifier TEXT,
  next_status TEXT,
  failure_detail TEXT DEFAULT NULL
)
RETURNS public.payment_transfers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  transfer_record public.payment_transfers;
BEGIN
  IF next_status NOT IN (
    'created', 'processing', 'settled', 'failed',
    'held', 'unclaimed', 'reversed'
  ) THEN
    RAISE EXCEPTION 'Invalid payout transfer status';
  END IF;

  SELECT * INTO transfer_record
  FROM public.payment_transfers
  WHERE (
      sender_item_identifier IS NOT NULL
      AND sender_item_id = sender_item_identifier
    )
    OR (
      sender_batch_identifier IS NOT NULL
      AND sender_batch_id = sender_batch_identifier
    )
    OR (
      provider_item_identifier IS NOT NULL
      AND provider_item_id = provider_item_identifier
    )
    OR (
      provider_batch_identifier IS NOT NULL
      AND provider_batch_id = provider_batch_identifier
    )
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF transfer_record.id IS NULL THEN
    RAISE EXCEPTION 'Payout transfer not found';
  END IF;

  UPDATE public.payment_transfers
  SET status = next_status,
      provider_batch_id = COALESCE(
        provider_batch_identifier,
        provider_batch_id
      ),
      provider_item_id = COALESCE(provider_item_identifier, provider_item_id),
      gateway_transfer_id = COALESCE(
        provider_item_identifier,
        provider_batch_identifier,
        gateway_transfer_id
      ),
      failure_reason = CASE
        WHEN next_status IN ('failed', 'held', 'unclaimed')
          THEN COALESCE(failure_detail, 'PayPal payout requires review')
        ELSE failure_reason
      END,
      settled_at = CASE
        WHEN next_status = 'settled' THEN COALESCE(settled_at, NOW())
        ELSE settled_at
      END,
      reversed_at = CASE
        WHEN next_status = 'reversed' THEN COALESCE(reversed_at, NOW())
        ELSE reversed_at
      END,
      updated_at = NOW()
  WHERE id = transfer_record.id
  RETURNING * INTO transfer_record;

  INSERT INTO public.notifications (user_id, type, title, message, link)
  SELECT
    payout_accounts.owner_id,
    'payout_changed',
    'Payout status updated',
    'A PayPal payout is now ' || next_status || '.',
    '/ngo/dashboard/payouts'
  FROM public.payout_accounts
  WHERE payout_accounts.id = transfer_record.payout_account_id;

  RETURN transfer_record;
END;
$$;

REVOKE ALL ON FUNCTION public.reconcile_paypal_payout_transfer(
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reconcile_paypal_payout_transfer(
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT
) TO service_role;
