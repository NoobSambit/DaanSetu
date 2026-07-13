-- Migration 017: normalized platform records, secure provider boundaries, and RLS.

-- Account roles use the product language. Existing supporter accounts were
-- previously stored as `user` and are migrated in place.
UPDATE public.users SET role = 'supporter' WHERE role = 'user';
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users
  ALTER COLUMN role SET DEFAULT 'supporter',
  ADD CONSTRAINT users_role_check
    CHECK (role IN ('supporter', 'ngo', 'corporate', 'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  requested_role TEXT;
BEGIN
  requested_role := CASE
    WHEN NEW.raw_user_meta_data->>'account_type' IN ('supporter', 'ngo', 'corporate')
      THEN NEW.raw_user_meta_data->>'account_type'
    ELSE 'supporter'
  END;

  INSERT INTO public.users (id, email, name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(
      NULLIF(BTRIM(NEW.raw_user_meta_data->>'name'), ''),
      split_part(COALESCE(NEW.email, 'member'), '@', 1)
    ),
    requested_role,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

CREATE TABLE IF NOT EXISTS public.payout_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  ngo_id UUID REFERENCES public.ngos(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'razorpay_route',
  gateway_account_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending', 'active', 'restricted', 'rejected', 'disabled')),
  beneficiary JSONB NOT NULL DEFAULT '{}',
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (ngo_id IS NULL OR owner_id IS NOT NULL)
);

ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS payout_account_id UUID REFERENCES public.payout_accounts(id),
  ADD COLUMN IF NOT EXISTS target_paise BIGINT,
  ADD COLUMN IF NOT EXISTS raised_paise BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS beneficiary JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS beneficiary_consent BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS evidence JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS moderation_notes TEXT,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

UPDATE public.campaigns AS campaigns
SET
  creator_id = ngos.user_id,
  target_paise = ROUND(campaigns.goal_amount * 100)::BIGINT,
  raised_paise = ROUND(campaigns.current_amount * 100)::BIGINT
FROM public.ngos AS ngos
WHERE campaigns.ngo_id = ngos.id
  AND (campaigns.creator_id IS NULL OR campaigns.target_paise IS NULL);

ALTER TABLE public.campaigns
  ALTER COLUMN creator_id SET NOT NULL,
  ALTER COLUMN target_paise SET NOT NULL,
  DROP CONSTRAINT IF EXISTS campaigns_status_check,
  DROP CONSTRAINT IF EXISTS campaigns_target_paise_positive,
  ADD CONSTRAINT campaigns_target_paise_positive CHECK (target_paise > 0),
  DROP CONSTRAINT IF EXISTS campaigns_raised_paise_nonnegative,
  ADD CONSTRAINT campaigns_raised_paise_nonnegative CHECK (raised_paise >= 0),
  ADD CONSTRAINT campaigns_status_check CHECK (
    status IN (
      'draft', 'pending_review', 'changes_requested', 'rejected', 'approved',
      'active', 'paused', 'completed', 'cancelled'
    )
  );

CREATE TABLE IF NOT EXISTS public.payment_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id UUID NOT NULL REFERENCES public.users(id),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id),
  amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
  gateway_order_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'created'
    CHECK (status IN ('created', 'authorized', 'captured', 'failed', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS amount_paise BIGINT,
  ADD COLUMN IF NOT EXISTS gateway_order_id TEXT,
  ADD COLUMN IF NOT EXISTS gateway_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS captured_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refunded_paise BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}';

UPDATE public.donations
SET
  amount_paise = ROUND(amount * 100)::BIGINT,
  status = CASE
    WHEN payment_status = 'completed' THEN 'captured'
    WHEN payment_status = 'failed' THEN 'failed'
    ELSE 'pending'
  END
WHERE amount_paise IS NULL;

ALTER TABLE public.donations
  ALTER COLUMN amount_paise SET NOT NULL,
  DROP CONSTRAINT IF EXISTS donations_amount_paise_positive,
  ADD CONSTRAINT donations_amount_paise_positive CHECK (amount_paise > 0),
  DROP CONSTRAINT IF EXISTS donations_refunded_paise_valid,
  ADD CONSTRAINT donations_refunded_paise_valid
    CHECK (refunded_paise >= 0 AND refunded_paise <= amount_paise),
  DROP CONSTRAINT IF EXISTS donations_status_check,
  ADD CONSTRAINT donations_status_check
    CHECK (status IN ('pending', 'authorized', 'captured', 'failed', 'partially_refunded', 'refunded'));

CREATE UNIQUE INDEX IF NOT EXISTS donations_gateway_order_unique
  ON public.donations(gateway_order_id) WHERE gateway_order_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS donations_gateway_payment_unique
  ON public.donations(gateway_payment_id) WHERE gateway_payment_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'processed', 'ignored', 'failed')),
  error_message TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id UUID NOT NULL REFERENCES public.users(id),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id),
  amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
  interval TEXT NOT NULL CHECK (interval IN ('monthly', 'quarterly', 'yearly')),
  gateway_plan_id TEXT NOT NULL,
  gateway_subscription_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'created'
    CHECK (status IN ('created', 'authenticated', 'active', 'paused', 'cancelled', 'pending', 'halted', 'completed', 'expired')),
  current_start TIMESTAMPTZ,
  current_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subscription_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  gateway_invoice_id TEXT NOT NULL UNIQUE,
  gateway_payment_id TEXT UNIQUE,
  amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
  status TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.refund_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID NOT NULL REFERENCES public.donations(id),
  requester_id UUID NOT NULL REFERENCES public.users(id),
  amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'approved', 'rejected', 'processing', 'processed', 'failed', 'reversed')),
  gateway_refund_id TEXT UNIQUE,
  reviewed_by UUID REFERENCES public.users(id),
  review_note TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payment_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID REFERENCES public.donations(id),
  payout_account_id UUID NOT NULL REFERENCES public.payout_accounts(id),
  amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
  gateway_transfer_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'created', 'settled', 'failed', 'reversed')),
  failure_reason TEXT,
  settled_at TIMESTAMPTZ,
  reversed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tax_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_id UUID NOT NULL REFERENCES public.ngos(id),
  donation_id UUID NOT NULL UNIQUE REFERENCES public.donations(id),
  financial_year TEXT NOT NULL CHECK (financial_year ~ '^[0-9]{4}-[0-9]{2}$'),
  certificate_number TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  issued_at DATE NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.volunteer_applications
  DROP CONSTRAINT IF EXISTS volunteer_applications_status_check,
  ALTER COLUMN status SET DEFAULT 'submitted';
UPDATE public.volunteer_applications SET status = 'submitted' WHERE status = 'pending';
ALTER TABLE public.volunteer_applications
  ADD CONSTRAINT volunteer_applications_status_check
    CHECK (status IN ('submitted', 'shortlisted', 'accepted', 'rejected', 'withdrawn'));

ALTER TABLE public.volunteer_hours
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS reviewer_id UUID REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS review_note TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE public.volunteer_hours
  DROP CONSTRAINT IF EXISTS volunteer_hours_status_check,
  ADD CONSTRAINT volunteer_hours_status_check
    CHECK (status IN ('pending', 'approved', 'rejected'));

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS media JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS is_impact_story BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS featured_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS hidden_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS hidden_reason TEXT;

ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_author_role_check;
ALTER TABLE public.posts
  ADD CONSTRAINT posts_author_role_check
    CHECK (author_role IN ('supporter', 'ngo', 'corporate', 'admin'));

DROP POLICY IF EXISTS "NGO, Corporate, and Admin users can create posts" ON public.posts;
DROP POLICY IF EXISTS "Verified users can create posts" ON public.posts;
CREATE POLICY "Verified users can create posts"
  ON public.posts FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1
      FROM public.users
      WHERE users.id = auth.uid()
        AND users.role = author_role
    )
  );

CREATE TABLE IF NOT EXISTS public.moderation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES public.content_reports(id),
  moderator_id UUID NOT NULL REFERENCES public.users(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('hide', 'restore', 'dismiss', 'feature', 'unfeature')),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.corporate_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_id UUID NOT NULL REFERENCES public.corporate_profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  invited_by UUID NOT NULL REFERENCES public.users(id),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_by UUID REFERENCES public.users(id),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.csr_initiatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_id UUID NOT NULL REFERENCES public.corporate_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  match_percent INTEGER NOT NULL DEFAULT 100 CHECK (match_percent BETWEEN 0 AND 500),
  per_employee_cap_paise BIGINT CHECK (per_employee_cap_paise > 0),
  initiative_cap_paise BIGINT CHECK (initiative_cap_paise > 0),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (ends_at > starts_at)
);

CREATE TABLE IF NOT EXISTS public.csr_match_pledges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id UUID NOT NULL REFERENCES public.csr_initiatives(id),
  donation_id UUID NOT NULL UNIQUE REFERENCES public.donations(id),
  employee_id UUID NOT NULL REFERENCES public.corporate_employees(id),
  matched_paise BIGINT NOT NULL CHECK (matched_paise > 0),
  status TEXT NOT NULL DEFAULT 'outstanding'
    CHECK (status IN ('outstanding', 'batched', 'settled', 'cancelled', 'reversed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.csr_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_id UUID NOT NULL REFERENCES public.corporate_profiles(id),
  amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
  gateway_order_id TEXT NOT NULL UNIQUE,
  gateway_payment_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'created'
    CHECK (status IN ('created', 'captured', 'failed', 'refunded', 'reversed')),
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.csr_settlement_pledges (
  settlement_id UUID NOT NULL REFERENCES public.csr_settlements(id) ON DELETE CASCADE,
  pledge_id UUID NOT NULL UNIQUE REFERENCES public.csr_match_pledges(id),
  PRIMARY KEY (settlement_id, pledge_id)
);

-- Remove unused generated features from the active product schema. Historical
-- migrations remain immutable, while the final schema no longer exposes them.
DROP TABLE IF EXISTS public.poll_votes CASCADE;
DROP TABLE IF EXISTS public.poll_options CASCADE;
DROP TABLE IF EXISTS public.polls CASCADE;
DROP TABLE IF EXISTS public.event_rsvps CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.story_views CASCADE;
DROP TABLE IF EXISTS public.stories CASCADE;
DROP TABLE IF EXISTS public.donation_gift_cards CASCADE;
DROP TABLE IF EXISTS public.sms_queue CASCADE;
DROP TABLE IF EXISTS public.predictive_analytics CASCADE;

-- Sensitive records are RLS protected. Provider event records and immutable
-- audit history have no client write policy and are written through server-only
-- service-role boundaries.
ALTER TABLE public.payout_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csr_initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csr_match_pledges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csr_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csr_settlement_pledges ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.payment_events FROM anon, authenticated;
REVOKE ALL ON TABLE public.audit_logs FROM anon, authenticated;
REVOKE ALL ON TABLE public.moderation_actions FROM anon, authenticated;
REVOKE ALL ON TABLE public.csr_match_pledges FROM anon, authenticated;
REVOKE ALL ON TABLE public.csr_settlements FROM anon, authenticated;

CREATE POLICY "Owners read payout accounts"
  ON public.payout_accounts FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.is_admin());
CREATE POLICY "Owners create payout drafts"
  ON public.payout_accounts FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() AND status = 'draft');
CREATE POLICY "Admins manage payout accounts"
  ON public.payout_accounts FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Donors read payment orders"
  ON public.payment_orders FOR SELECT TO authenticated
  USING (donor_id = auth.uid() OR public.is_admin());
CREATE POLICY "Donors read subscriptions"
  ON public.subscriptions FOR SELECT TO authenticated
  USING (donor_id = auth.uid() OR public.is_admin());
CREATE POLICY "Donors read subscription invoices"
  ON public.subscription_invoices FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.subscriptions
      WHERE subscriptions.id = subscription_id
        AND (subscriptions.donor_id = auth.uid() OR public.is_admin())
    )
  );
CREATE POLICY "Donors create refund requests"
  ON public.refund_requests FOR INSERT TO authenticated
  WITH CHECK (
    requester_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.donations
      WHERE donations.id = donation_id AND donations.user_id = auth.uid()
    )
  );
CREATE POLICY "Donors and admins read refund requests"
  ON public.refund_requests FOR SELECT TO authenticated
  USING (requester_id = auth.uid() OR public.is_admin());
CREATE POLICY "Admins manage refund requests"
  ON public.refund_requests FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Donors read own tax certificates"
  ON public.tax_certificates FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.donations
      WHERE donations.id = donation_id AND donations.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.ngos
      WHERE ngos.id = ngo_id AND ngos.user_id = auth.uid()
    )
  );

CREATE POLICY "Corporate owners manage invitations"
  ON public.corporate_invitations FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.corporate_profiles
      WHERE corporate_profiles.id = corporate_id
        AND corporate_profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.corporate_profiles
      WHERE corporate_profiles.id = corporate_id
        AND corporate_profiles.user_id = auth.uid()
    )
  );
CREATE POLICY "Corporate owners manage CSR initiatives"
  ON public.csr_initiatives FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.corporate_profiles
      WHERE corporate_profiles.id = corporate_id
        AND corporate_profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.corporate_profiles
      WHERE corporate_profiles.id = corporate_id
        AND corporate_profiles.user_id = auth.uid()
    )
  );

-- Supabase Storage buckets. Public media is readable by everyone; private
-- compliance records are available only through authenticated ownership checks.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('community-media', 'community-media', TRUE, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('campaign-evidence', 'campaign-evidence', FALSE, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
  ('tax-certificates', 'tax-certificates', FALSE, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "Users upload own community media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'community-media'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );
CREATE POLICY "Public reads community media"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'community-media');
CREATE POLICY "Campaign owners manage evidence"
  ON storage.objects FOR ALL TO authenticated
  USING (
    bucket_id = 'campaign-evidence'
    AND EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id::TEXT = (storage.foldername(name))[1]
        AND campaigns.creator_id = auth.uid()
    )
  )
  WITH CHECK (
    bucket_id = 'campaign-evidence'
    AND EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id::TEXT = (storage.foldername(name))[1]
        AND campaigns.creator_id = auth.uid()
    )
  );
CREATE POLICY "Certificate owners read official 10BE files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'tax-certificates'
    AND EXISTS (
      SELECT 1 FROM public.tax_certificates
      JOIN public.donations ON donations.id = tax_certificates.donation_id
      WHERE tax_certificates.storage_path = storage.objects.name
        AND (
          donations.user_id = auth.uid()
          OR public.is_admin()
          OR EXISTS (
            SELECT 1 FROM public.ngos
            WHERE ngos.id = tax_certificates.ngo_id
              AND ngos.user_id = auth.uid()
          )
        )
    )
  );

CREATE INDEX IF NOT EXISTS campaigns_discovery_idx
  ON public.campaigns(status, category, deadline);
CREATE INDEX IF NOT EXISTS payment_orders_donor_idx
  ON public.payment_orders(donor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS subscriptions_donor_idx
  ON public.subscriptions(donor_id, status);
CREATE INDEX IF NOT EXISTS refund_requests_status_idx
  ON public.refund_requests(status, created_at);
CREATE INDEX IF NOT EXISTS payout_accounts_owner_idx
  ON public.payout_accounts(owner_id, status);
CREATE INDEX IF NOT EXISTS corporate_invitations_lookup_idx
  ON public.corporate_invitations(email, status, expires_at);
CREATE INDEX IF NOT EXISTS csr_match_pledges_status_idx
  ON public.csr_match_pledges(initiative_id, status);
