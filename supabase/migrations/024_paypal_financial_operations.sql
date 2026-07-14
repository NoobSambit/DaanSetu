-- Migration 024: idempotent PayPal refunds and subscription reconciliation.

ALTER TABLE public.payout_accounts
  ADD COLUMN IF NOT EXISTS beneficiary_review_note TEXT;

CREATE OR REPLACE FUNCTION public.complete_paypal_refund(
  refund_request_uuid UUID,
  gateway_refund_identifier TEXT,
  refunded_amount_paise BIGINT
)
RETURNS public.refund_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  request_record public.refund_requests;
  donation_record public.donations;
BEGIN
  SELECT * INTO request_record
  FROM public.refund_requests
  WHERE id = refund_request_uuid
  FOR UPDATE;

  IF request_record.id IS NULL THEN
    RAISE EXCEPTION 'Refund request not found';
  END IF;
  IF request_record.gateway_refund_id = gateway_refund_identifier
     AND request_record.status = 'processed' THEN
    RETURN request_record;
  END IF;
  IF request_record.status NOT IN ('approved', 'processing') THEN
    RAISE EXCEPTION 'Refund request is not executable';
  END IF;
  IF request_record.amount_paise <> refunded_amount_paise THEN
    RAISE EXCEPTION 'Refund amount mismatch';
  END IF;

  SELECT * INTO donation_record
  FROM public.donations
  WHERE id = request_record.donation_id
  FOR UPDATE;

  IF donation_record.id IS NULL OR donation_record.is_demo THEN
    RAISE EXCEPTION 'Donation is not refundable';
  END IF;
  IF donation_record.refunded_paise + refunded_amount_paise > donation_record.amount_paise THEN
    RAISE EXCEPTION 'Refund exceeds captured amount';
  END IF;

  UPDATE public.donations
  SET refunded_paise = refunded_paise + refunded_amount_paise,
      status = CASE
        WHEN refunded_paise + refunded_amount_paise = amount_paise THEN 'refunded'
        ELSE 'partially_refunded'
      END
  WHERE id = donation_record.id;

  UPDATE public.refund_requests
  SET status = 'processed',
      gateway_refund_id = gateway_refund_identifier,
      reviewed_at = COALESCE(reviewed_at, NOW()),
      updated_at = NOW()
  WHERE id = request_record.id
  RETURNING * INTO request_record;

  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (
    request_record.requester_id,
    'refund_changed',
    'Refund completed',
    'Your approved PayPal refund has been completed.',
    '/dashboard/giving'
  );

  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, changes)
  VALUES (
    request_record.reviewed_by,
    'refund.completed',
    'refund_request',
    request_record.id,
    jsonb_build_object(
      'gateway_refund_id', gateway_refund_identifier,
      'amount_paise', refunded_amount_paise
    )
  );

  RETURN request_record;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_paypal_refund(UUID, TEXT, BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_paypal_refund(UUID, TEXT, BIGINT) TO service_role;

ALTER TABLE public.donations
  DROP CONSTRAINT IF EXISTS donations_status_check,
  ADD CONSTRAINT donations_status_check CHECK (
    status IN (
      'pending', 'authorized', 'captured', 'failed',
      'partially_refunded', 'refunded', 'reversed'
    )
  );

CREATE OR REPLACE FUNCTION public.reverse_paypal_capture(
  capture_identifier TEXT
)
RETURNS public.donations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  donation_record public.donations;
BEGIN
  SELECT * INTO donation_record
  FROM public.donations
  WHERE gateway_payment_id = capture_identifier
  FOR UPDATE;

  IF donation_record.id IS NULL THEN
    RAISE EXCEPTION 'Captured donation not found';
  END IF;
  IF donation_record.status = 'reversed' THEN
    RETURN donation_record;
  END IF;

  UPDATE public.donations
  SET status = 'reversed'
  WHERE id = donation_record.id
  RETURNING * INTO donation_record;

  IF donation_record.is_demo = FALSE THEN
    UPDATE public.campaigns
    SET raised_paise = GREATEST(0, raised_paise - donation_record.amount_paise),
        current_amount = GREATEST(
          0,
          current_amount - (donation_record.amount_paise::NUMERIC / 100)
        ),
        updated_at = NOW()
    WHERE id = donation_record.campaign_id;
  END IF;

  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (
    donation_record.user_id,
    'donation_captured',
    'Payment reversed',
    'PayPal reversed a captured payment. Contact support for help.',
    '/grievance'
  );

  INSERT INTO public.audit_logs (action, entity_type, entity_id, changes)
  VALUES (
    'payment.capture_reversed',
    'donation',
    donation_record.id,
    jsonb_build_object('capture_id', capture_identifier)
  );

  RETURN donation_record;
END;
$$;

REVOKE ALL ON FUNCTION public.reverse_paypal_capture(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reverse_paypal_capture(TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.reconcile_paypal_subscription(
  subscription_identifier TEXT,
  next_status TEXT
)
RETURNS public.subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  subscription_record public.subscriptions;
BEGIN
  IF next_status NOT IN (
    'authenticated', 'active', 'paused', 'cancelled',
    'pending', 'halted', 'completed', 'expired'
  ) THEN
    RAISE EXCEPTION 'Invalid subscription status';
  END IF;

  SELECT * INTO subscription_record
  FROM public.subscriptions
  WHERE gateway_subscription_id = subscription_identifier
  FOR UPDATE;

  IF subscription_record.id IS NULL THEN
    RAISE EXCEPTION 'Subscription not found';
  END IF;

  UPDATE public.subscriptions
  SET status = next_status,
      cancelled_at = CASE
        WHEN next_status = 'cancelled' THEN COALESCE(cancelled_at, NOW())
        ELSE cancelled_at
      END,
      updated_at = NOW()
  WHERE id = subscription_record.id
  RETURNING * INTO subscription_record;

  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (
    subscription_record.donor_id,
    'subscription_changed',
    'Recurring gift updated',
    'Your recurring gift is now ' || next_status || '.',
    '/dashboard/giving'
  );

  RETURN subscription_record;
END;
$$;

REVOKE ALL ON FUNCTION public.reconcile_paypal_subscription(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reconcile_paypal_subscription(TEXT, TEXT) TO service_role;
