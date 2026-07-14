-- Migration 041: finish the paise-only money model and protect account emails.

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

  IF campaign_record.id IS NULL THEN
    RAISE EXCEPTION 'Campaign not found';
  END IF;

  INSERT INTO public.donations (
    user_id,
    ngo_id,
    campaign_id,
    amount_paise,
    cause,
    is_anonymous,
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
    credited_amount_paise,
    payment_order.cause,
    payment_order.is_anonymous,
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
  SET status = 'captured',
      updated_at = NOW()
  WHERE id = payment_order.id;

  IF demo_payment = FALSE THEN
    UPDATE public.campaigns
    SET raised_paise = raised_paise + credited_amount_paise,
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
    OR subscription_record.settlement_amount_minor <> received_settlement_minor
  THEN
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
    amount_paise,
    cause,
    is_anonymous,
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
    subscription_record.amount_paise,
    subscription_record.cause,
    subscription_record.is_anonymous,
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
    SET raised_paise = GREATEST(0, raised_paise - refunded_amount_paise),
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
      'gateway_refund_id', gateway_refund_identifier,
      'amount_paise', refunded_amount_paise
    )
  );

  RETURN request_record;
END;
$$;

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
      amount_paise,
      cause,
      is_anonymous,
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
    ) VALUES (
      original_donation.user_id,
      original_donation.ngo_id,
      original_donation.campaign_id,
      pledge_record.matched_paise,
      original_donation.cause,
      FALSE,
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
        updated_at = NOW()
    WHERE id = original_donation.campaign_id;
  END LOOP;

  RETURN settlement.id;
END;
$$;

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
      'providerCaptureId', provider_capture_id,
      'providerEventId', provider_event_id
    )
  );

  RETURN settlement_record;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_supporter_campaign(
  campaign_title TEXT,
  campaign_short_description TEXT,
  campaign_description TEXT,
  campaign_target_paise BIGINT,
  campaign_deadline TIMESTAMPTZ,
  campaign_category TEXT,
  campaign_image_url TEXT,
  beneficiary_name TEXT,
  beneficiary_relationship TEXT,
  payout_email TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  caller_id UUID := auth.uid();
  payout_id UUID;
  campaign_id UUID;
BEGIN
  IF caller_id IS NULL OR NOT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = caller_id
      AND email_confirmed_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Verified authentication required';
  END IF;

  IF campaign_target_paise < 10000
    OR campaign_deadline <= NOW()
    OR length(btrim(campaign_title)) NOT BETWEEN 5 AND 100
    OR length(btrim(campaign_short_description)) NOT BETWEEN 10 AND 200
    OR length(btrim(campaign_description)) NOT BETWEEN 30 AND 10000
    OR length(btrim(beneficiary_name)) NOT BETWEEN 2 AND 120
    OR length(btrim(beneficiary_relationship)) NOT BETWEEN 3 AND 200
    OR payout_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
    OR campaign_category NOT IN (
      'education',
      'food',
      'health',
      'women',
      'animals',
      'disaster'
    )
  THEN
    RAISE EXCEPTION 'Invalid fundraiser details';
  END IF;

  INSERT INTO public.payout_accounts (
    owner_id,
    provider,
    status,
    beneficiary
  ) VALUES (
    caller_id,
    'paypal',
    'pending',
    jsonb_build_object(
      'beneficiaryName', beneficiary_name,
      'recipientEmail', lower(payout_email)
    )
  )
  RETURNING id INTO payout_id;

  INSERT INTO public.campaigns (
    ngo_id,
    creator_id,
    payout_account_id,
    title,
    short_description,
    description,
    target_paise,
    deadline,
    image_url,
    category,
    status,
    beneficiary,
    beneficiary_consent,
    evidence
  ) VALUES (
    NULL,
    caller_id,
    payout_id,
    campaign_title,
    campaign_short_description,
    campaign_description,
    campaign_target_paise,
    campaign_deadline,
    NULLIF(campaign_image_url, ''),
    campaign_category,
    'draft',
    jsonb_build_object(
      'name', beneficiary_name,
      'relationship', beneficiary_relationship
    ),
    TRUE,
    '[]'::JSONB
  )
  RETURNING id INTO campaign_id;

  RETURN campaign_id;
END;
$$;

DROP FUNCTION IF EXISTS public.increment_campaign_amount(UUID, NUMERIC);
DROP FUNCTION IF EXISTS public.increment_corporate_campaign_amount(UUID, NUMERIC);
DROP FUNCTION IF EXISTS public.get_user_rank(UUID);

DROP FUNCTION IF EXISTS public.get_user_stats(UUID);
CREATE FUNCTION public.get_user_stats(user_uuid UUID)
RETURNS TABLE (
  total_donations NUMERIC,
  donation_count INTEGER,
  volunteer_applications INTEGER,
  posts_created INTEGER,
  comments_made INTEGER,
  badges_earned INTEGER,
  following_count INTEGER,
  follower_count INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    COALESCE((
      SELECT SUM(d.amount_paise - d.refunded_paise)::NUMERIC / 100
      FROM public.donations AS d
      WHERE d.user_id = user_uuid
        AND d.is_demo = FALSE
        AND d.is_csr_match = FALSE
        AND d.status IN ('captured', 'partially_refunded')
        AND (d.is_anonymous = FALSE OR auth.uid() = user_uuid)
    ), 0),
    COALESCE((
      SELECT COUNT(*)::INTEGER
      FROM public.donations AS d
      WHERE d.user_id = user_uuid
        AND d.is_demo = FALSE
        AND d.is_csr_match = FALSE
        AND d.status IN ('captured', 'partially_refunded')
        AND d.amount_paise > d.refunded_paise
        AND (d.is_anonymous = FALSE OR auth.uid() = user_uuid)
    ), 0),
    COALESCE((
      SELECT COUNT(*)::INTEGER
      FROM public.volunteer_applications AS va
      WHERE va.user_id = user_uuid
    ), 0),
    COALESCE((
      SELECT COUNT(*)::INTEGER
      FROM public.posts AS p
      WHERE p.author_id = user_uuid
        AND p.status = 'published'
        AND p.hidden_at IS NULL
    ), 0),
    COALESCE((
      SELECT COUNT(*)::INTEGER
      FROM public.post_comments AS pc
      WHERE pc.user_id = user_uuid
    ), 0),
    COALESCE((
      SELECT COUNT(*)::INTEGER
      FROM public.user_badges AS ub
      WHERE ub.user_id = user_uuid
    ), 0),
    public.get_following_count(user_uuid),
    public.get_follower_count(user_uuid, 'user');
$$;

REVOKE ALL ON FUNCTION public.get_user_stats(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_stats(UUID) TO authenticated;

ALTER TABLE public.donations
  ALTER COLUMN ngo_id DROP NOT NULL;

ALTER TABLE public.campaigns
  DROP COLUMN goal_amount,
  DROP COLUMN current_amount;

ALTER TABLE public.corporate_campaigns
  DROP COLUMN goal_amount,
  DROP COLUMN current_amount;

ALTER TABLE public.donations
  DROP COLUMN amount,
  DROP COLUMN payment_status;

DROP POLICY IF EXISTS "Users are publicly viewable" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Public users are viewable" ON public.users;
DROP POLICY IF EXISTS "Users can view profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update their own public profile"
  ON public.users;

CREATE POLICY "Authenticated users can view user profiles"
  ON public.users FOR SELECT TO authenticated
  USING (TRUE);

REVOKE ALL ON TABLE public.users FROM anon, authenticated;
GRANT SELECT (id, name, role, created_at, updated_at)
  ON public.users TO authenticated;

CREATE OR REPLACE FUNCTION public.save_user_public_profile(
  display_name TEXT,
  profile_bio TEXT,
  profile_avatar_url TEXT,
  profile_location TEXT,
  profile_website TEXT,
  profile_twitter_handle TEXT,
  profile_linkedin_url TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  caller_id UUID := auth.uid();
BEGIN
  IF caller_id IS NULL OR NOT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = caller_id
      AND email_confirmed_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Verified authentication required';
  END IF;

  UPDATE public.users
  SET name = display_name,
      updated_at = NOW()
  WHERE id = caller_id;

  INSERT INTO public.user_profiles (
    user_id,
    bio,
    avatar_url,
    location,
    website,
    twitter_handle,
    linkedin_url,
    updated_at
  ) VALUES (
    caller_id,
    profile_bio,
    profile_avatar_url,
    profile_location,
    profile_website,
    profile_twitter_handle,
    profile_linkedin_url,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET bio = EXCLUDED.bio,
      avatar_url = EXCLUDED.avatar_url,
      location = EXCLUDED.location,
      website = EXCLUDED.website,
      twitter_handle = EXCLUDED.twitter_handle,
      linkedin_url = EXCLUDED.linkedin_url,
      updated_at = NOW();
END;
$$;

REVOKE ALL ON FUNCTION public.save_user_public_profile(
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_user_public_profile(
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT
) TO authenticated;
