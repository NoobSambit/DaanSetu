-- Migration 038: refund progress correction and CSR settlement recovery.

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
    AND request_record.status = 'processed'
  THEN
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
  IF donation_record.refunded_paise + refunded_amount_paise
    > donation_record.amount_paise
  THEN
    RAISE EXCEPTION 'Refund exceeds captured amount';
  END IF;

  UPDATE public.donations
  SET refunded_paise = refunded_paise + refunded_amount_paise,
      status = CASE
        WHEN refunded_paise + refunded_amount_paise = amount_paise
          THEN 'refunded'
        ELSE 'partially_refunded'
      END
  WHERE id = donation_record.id;

  IF donation_record.is_csr_match = FALSE THEN
    UPDATE public.campaigns
    SET raised_paise = GREATEST(
          0,
          raised_paise - refunded_amount_paise
        ),
        current_amount = GREATEST(
          0,
          current_amount - (refunded_amount_paise::NUMERIC / 100)
        ),
        updated_at = NOW()
    WHERE id = donation_record.campaign_id;
  END IF;

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

  INSERT INTO public.audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    changes
  ) VALUES (
    request_record.reviewed_by,
    'refund.completed',
    'refund_request',
    request_record.id,
    jsonb_build_object(
      'gateway_refund_id',
      gateway_refund_identifier,
      'amount_paise',
      refunded_amount_paise
    )
  );

  RETURN request_record;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_paypal_refund(UUID, TEXT, BIGINT)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_paypal_refund(UUID, TEXT, BIGINT)
  TO service_role;

CREATE OR REPLACE FUNCTION public.cancel_csr_settlement(
  provider_order_id TEXT
)
RETURNS public.csr_settlements
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  settlement_record public.csr_settlements;
BEGIN
  SELECT * INTO settlement_record
  FROM public.csr_settlements
  WHERE gateway_order_id = provider_order_id
  FOR UPDATE;

  IF settlement_record.id IS NULL THEN
    RAISE EXCEPTION 'CSR settlement not found';
  END IF;
  IF settlement_record.status = 'failed' THEN
    RETURN settlement_record;
  END IF;
  IF settlement_record.status <> 'created' THEN
    RAISE EXCEPTION 'CSR settlement cannot be cancelled';
  END IF;

  UPDATE public.csr_match_pledges
  SET status = 'outstanding',
      updated_at = NOW()
  WHERE id IN (
    SELECT pledge_id
    FROM public.csr_settlement_pledges
    WHERE settlement_id = settlement_record.id
  )
    AND status = 'batched';

  UPDATE public.csr_settlements
  SET status = 'failed',
      updated_at = NOW()
  WHERE id = settlement_record.id
  RETURNING * INTO settlement_record;

  INSERT INTO public.audit_logs (action, entity_type, entity_id, changes)
  VALUES (
    'csr_settlement.cancelled',
    'csr_settlement',
    settlement_record.id,
    jsonb_build_object('providerOrderId', provider_order_id)
  );

  RETURN settlement_record;
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_csr_settlement(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_csr_settlement(TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.reverse_csr_settlement(
  provider_capture_id TEXT,
  next_status TEXT,
  provider_event_id TEXT
)
RETURNS public.csr_settlements
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  settlement_record public.csr_settlements;
  pledge_record RECORD;
  allocated_donation public.donations;
  corporate_owner UUID;
BEGIN
  IF next_status NOT IN ('refunded', 'reversed') THEN
    RAISE EXCEPTION 'Invalid CSR reversal status';
  END IF;

  SELECT * INTO settlement_record
  FROM public.csr_settlements
  WHERE gateway_payment_id = provider_capture_id
  FOR UPDATE;

  IF settlement_record.id IS NULL THEN
    RAISE EXCEPTION 'CSR settlement not found';
  END IF;
  IF settlement_record.status IN ('refunded', 'reversed') THEN
    RETURN settlement_record;
  END IF;
  IF settlement_record.status <> 'captured' THEN
    RAISE EXCEPTION 'CSR settlement is not reversible';
  END IF;

  FOR pledge_record IN
    SELECT pledge.*
    FROM public.csr_match_pledges AS pledge
    JOIN public.csr_settlement_pledges AS batch
      ON batch.pledge_id = pledge.id
    WHERE batch.settlement_id = settlement_record.id
      AND pledge.status = 'settled'
    FOR UPDATE OF pledge
  LOOP
    SELECT * INTO allocated_donation
    FROM public.donations
    WHERE id = pledge_record.allocated_donation_id
    FOR UPDATE;

    IF allocated_donation.id IS NOT NULL THEN
      UPDATE public.donations
      SET status = next_status,
          refunded_paise = CASE
            WHEN next_status = 'refunded' THEN amount_paise
            ELSE refunded_paise
          END
      WHERE id = allocated_donation.id;

      UPDATE public.campaigns
      SET raised_paise = GREATEST(
            0,
            raised_paise - allocated_donation.amount_paise
          ),
          current_amount = GREATEST(
            0,
            current_amount - (allocated_donation.amount_paise::NUMERIC / 100)
          ),
          updated_at = NOW()
      WHERE id = allocated_donation.campaign_id;
    END IF;

    UPDATE public.csr_match_pledges
    SET status = 'reversed',
        updated_at = NOW()
    WHERE id = pledge_record.id;
  END LOOP;

  UPDATE public.csr_settlements
  SET status = next_status,
      updated_at = NOW()
  WHERE id = settlement_record.id
  RETURNING * INTO settlement_record;

  SELECT user_id INTO corporate_owner
  FROM public.corporate_profiles
  WHERE id = settlement_record.corporate_id;

  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (
    corporate_owner,
    'refund_changed',
    'CSR settlement reversed',
    'PayPal marked a matching settlement as ' || next_status || '.',
    '/corporate/settlements'
  );

  INSERT INTO public.audit_logs (action, entity_type, entity_id, changes)
  VALUES (
    'csr_settlement.' || next_status,
    'csr_settlement',
    settlement_record.id,
    jsonb_build_object(
      'providerCaptureId',
      provider_capture_id,
      'providerEventId',
      provider_event_id
    )
  );

  RETURN settlement_record;
END;
$$;

REVOKE ALL ON FUNCTION public.reverse_csr_settlement(TEXT, TEXT, TEXT)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reverse_csr_settlement(TEXT, TEXT, TEXT)
  TO service_role;
