-- Migration 039: make financial and CSR decisions atomic, audited, and visible.

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check,
  ADD CONSTRAINT notifications_type_check CHECK (
    type IN (
      'campaign_milestone', 'volunteer_accepted', 'volunteer_application',
      'volunteer_hours', 'volunteer_certificate', 'badge_unlocked',
      'post_liked', 'post_commented', 'partnership_accepted',
      'partnership_changed', 'donation_captured', 'subscription_changed',
      'refund_changed', 'payout_changed', 'campaign_decision',
      'moderation_decision', 'csr_invitation', 'ngo_verification'
    )
  );

CREATE OR REPLACE FUNCTION public.review_refund_request(
  refund_request_uuid UUID,
  decision TEXT,
  decision_note TEXT
)
RETURNS public.refund_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  request_record public.refund_requests;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  IF decision NOT IN ('approve', 'reject')
    OR NULLIF(btrim(decision_note), '') IS NULL
  THEN
    RAISE EXCEPTION 'Invalid refund decision';
  END IF;

  SELECT * INTO request_record
  FROM public.refund_requests
  WHERE id = refund_request_uuid
  FOR UPDATE;

  IF request_record.id IS NULL
    OR request_record.status <> 'submitted'
    OR request_record.gateway_refund_id IS NOT NULL
  THEN
    RAISE EXCEPTION 'Refund request is not actionable';
  END IF;

  UPDATE public.refund_requests
  SET status = CASE WHEN decision = 'approve' THEN 'processing' ELSE 'rejected' END,
      reviewed_by = auth.uid(),
      review_note = btrim(decision_note),
      reviewed_at = NOW(),
      updated_at = NOW()
  WHERE id = request_record.id
  RETURNING * INTO request_record;

  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, changes)
  VALUES (
    auth.uid(),
    'refund.' || CASE WHEN decision = 'approve' THEN 'processing' ELSE 'rejected' END,
    'refund_request',
    request_record.id,
    jsonb_build_object('decision', decision, 'note', btrim(decision_note))
  );

  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (
    request_record.requester_id,
    'refund_changed',
    'Refund request updated',
    CASE
      WHEN decision = 'approve' THEN 'Your refund was approved and is being processed.'
      ELSE 'Your refund request was not approved. Review the decision note for details.'
    END,
    '/dashboard/giving/refunds'
  );

  RETURN request_record;
END;
$$;

REVOKE ALL ON FUNCTION public.review_refund_request(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_refund_request(UUID, TEXT, TEXT)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.review_payout_account(
  payout_account_uuid UUID,
  next_status TEXT,
  decision_note TEXT
)
RETURNS public.payout_accounts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  account_record public.payout_accounts;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  IF next_status NOT IN ('active', 'rejected', 'restricted')
    OR NULLIF(btrim(decision_note), '') IS NULL
  THEN
    RAISE EXCEPTION 'Invalid payout account decision';
  END IF;

  SELECT * INTO account_record
  FROM public.payout_accounts
  WHERE id = payout_account_uuid
  FOR UPDATE;

  IF account_record.id IS NULL
    OR account_record.status NOT IN ('pending', 'restricted')
  THEN
    RAISE EXCEPTION 'Payout account is not actionable';
  END IF;

  UPDATE public.payout_accounts
  SET status = next_status,
      activated_at = CASE WHEN next_status = 'active' THEN NOW() ELSE NULL END,
      beneficiary_review_note = btrim(decision_note),
      updated_at = NOW()
  WHERE id = account_record.id
  RETURNING * INTO account_record;

  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, changes)
  VALUES (
    auth.uid(),
    'payout_account.' || next_status,
    'payout_account',
    account_record.id,
    jsonb_build_object('status', next_status, 'note', btrim(decision_note))
  );

  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (
    account_record.owner_id,
    'payout_changed',
    'Payout account updated',
    'Your payout account is now ' || next_status || '.',
    CASE
      WHEN account_record.ngo_id IS NULL THEN '/dashboard/fundraisers'
      ELSE '/ngo/dashboard/payouts'
    END
  );

  RETURN account_record;
END;
$$;

REVOKE ALL ON FUNCTION public.review_payout_account(UUID, TEXT, TEXT)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_payout_account(UUID, TEXT, TEXT)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.create_corporate_invitation(
  invited_email TEXT,
  invitation_token_hash TEXT,
  invitation_url TEXT,
  invitation_expires_at TIMESTAMPTZ
)
RETURNS public.corporate_invitations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  corporate_record public.corporate_profiles;
  invitation_record public.corporate_invitations;
  invited_user public.users;
  normalized_email TEXT := lower(btrim(invited_email));
BEGIN
  IF NOT public.is_email_verified()
    OR normalized_email !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'
    OR length(invitation_token_hash) <> 64
    OR invitation_url !~ '^https?://'
    OR invitation_expires_at <= NOW()
  THEN
    RAISE EXCEPTION 'Invalid corporate invitation';
  END IF;

  SELECT * INTO corporate_record
  FROM public.corporate_profiles
  WHERE user_id = auth.uid();

  IF corporate_record.id IS NULL THEN
    RAISE EXCEPTION 'Corporate profile required';
  END IF;

  INSERT INTO public.corporate_invitations (
    corporate_id,
    email,
    token_hash,
    invited_by,
    expires_at
  ) VALUES (
    corporate_record.id,
    normalized_email,
    invitation_token_hash,
    auth.uid(),
    invitation_expires_at
  )
  RETURNING * INTO invitation_record;

  INSERT INTO public.email_queue (
    recipient_email,
    subject,
    html_body,
    text_body,
    template_id,
    metadata
  ) VALUES (
    normalized_email,
    'You are invited to a DaanSetu CSR team',
    '<p>You have been invited to join ' ||
      replace(
        replace(corporate_record.company_name, '&', '&amp;'),
        '<',
        '&lt;'
      ) ||
      ' on DaanSetu.</p><p><a href="' ||
      replace(
        replace(replace(invitation_url, '&', '&amp;'), '<', '&lt;'),
        '"',
        '&quot;'
      ) ||
      '">Accept invitation</a></p>',
    'Accept your DaanSetu CSR invitation: ' || invitation_url,
    'corporate_invitation',
    jsonb_build_object('invitation_id', invitation_record.id)
  );

  SELECT * INTO invited_user
  FROM public.users
  WHERE lower(email) = normalized_email;

  IF invited_user.id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      invited_user.id,
      'csr_invitation',
      'Corporate CSR invitation',
      corporate_record.company_name || ' invited you to its CSR team.',
      invitation_url
    );
  END IF;

  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, changes)
  VALUES (
    auth.uid(),
    'corporate_invitation.created',
    'corporate_invitation',
    invitation_record.id,
    jsonb_build_object('email', normalized_email)
  );

  RETURN invitation_record;
END;
$$;

REVOKE ALL ON FUNCTION public.create_corporate_invitation(TEXT, TEXT, TEXT, TIMESTAMPTZ)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_corporate_invitation(TEXT, TEXT, TEXT, TIMESTAMPTZ)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.accept_corporate_invitation(
  invitation_token_hash TEXT
)
RETURNS public.corporate_invitations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  invitation_record public.corporate_invitations;
  member public.users;
  company_name TEXT;
BEGIN
  IF NOT public.is_email_verified() THEN
    RAISE EXCEPTION 'Verified authentication required';
  END IF;

  SELECT * INTO invitation_record
  FROM public.corporate_invitations
  WHERE token_hash = invitation_token_hash
  FOR UPDATE;

  SELECT * INTO member FROM public.users WHERE id = auth.uid();

  IF invitation_record.id IS NULL
    OR invitation_record.status <> 'pending'
    OR invitation_record.expires_at <= NOW()
    OR lower(invitation_record.email) <> lower(member.email)
  THEN
    RAISE EXCEPTION 'Invitation expired, revoked, or belongs to another account';
  END IF;

  INSERT INTO public.corporate_employees (
    corporate_id,
    user_id,
    email,
    name
  ) VALUES (
    invitation_record.corporate_id,
    auth.uid(),
    invitation_record.email,
    member.name
  )
  ON CONFLICT (corporate_id, email) DO UPDATE
  SET user_id = EXCLUDED.user_id,
      name = EXCLUDED.name;

  UPDATE public.corporate_invitations
  SET status = 'accepted',
      accepted_by = auth.uid(),
      accepted_at = NOW()
  WHERE id = invitation_record.id
  RETURNING * INTO invitation_record;

  SELECT corporate_profiles.company_name INTO company_name
  FROM public.corporate_profiles
  WHERE id = invitation_record.corporate_id;

  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (
    auth.uid(),
    'csr_invitation',
    'CSR team joined',
    'You joined the ' || company_name || ' CSR team.',
    '/dashboard'
  );

  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, changes)
  VALUES (
    auth.uid(),
    'corporate_invitation.accepted',
    'corporate_invitation',
    invitation_record.id,
    jsonb_build_object('corporate_id', invitation_record.corporate_id)
  );

  RETURN invitation_record;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_corporate_invitation(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_corporate_invitation(TEXT)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.review_partnership_request(
  partnership_request_uuid UUID,
  next_status TEXT
)
RETURNS public.partnership_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  request_record public.partnership_requests;
  campaign_record public.corporate_campaigns;
  ngo_owner UUID;
BEGIN
  IF next_status NOT IN ('accepted', 'rejected') THEN
    RAISE EXCEPTION 'Invalid partnership decision';
  END IF;

  SELECT * INTO request_record
  FROM public.partnership_requests
  WHERE id = partnership_request_uuid
  FOR UPDATE;

  SELECT * INTO campaign_record
  FROM public.corporate_campaigns
  WHERE id = request_record.corporate_campaign_id;

  IF request_record.id IS NULL
    OR request_record.status <> 'pending'
    OR NOT EXISTS (
      SELECT 1
      FROM public.corporate_profiles
      WHERE id = campaign_record.corporate_id
        AND user_id = auth.uid()
    )
  THEN
    RAISE EXCEPTION 'Partnership request is not actionable';
  END IF;

  UPDATE public.partnership_requests
  SET status = next_status,
      updated_at = NOW()
  WHERE id = request_record.id
  RETURNING * INTO request_record;

  SELECT user_id INTO ngo_owner
  FROM public.ngos
  WHERE id = request_record.ngo_id;

  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (
    ngo_owner,
    'partnership_changed',
    'CSR partnership request updated',
    'Your partnership request for "' || campaign_record.title || '" was ' ||
      next_status || '.',
    '/csr-campaigns'
  );

  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, changes)
  VALUES (
    auth.uid(),
    'partnership.' || next_status,
    'partnership_request',
    request_record.id,
    jsonb_build_object('status', next_status)
  );

  RETURN request_record;
END;
$$;

REVOKE ALL ON FUNCTION public.review_partnership_request(UUID, TEXT)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_partnership_request(UUID, TEXT)
  TO authenticated;
