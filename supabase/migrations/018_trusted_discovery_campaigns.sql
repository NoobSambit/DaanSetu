-- Migration 018: trusted campaign workflows, eligible reviews, and discovery indexes.

ALTER TABLE public.ngo_reviews
  ADD COLUMN IF NOT EXISTS hidden_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS hidden_reason TEXT,
  ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES public.users(id);

ALTER TABLE public.content_reports
  DROP CONSTRAINT IF EXISTS content_reports_entity_type_check,
  ADD CONSTRAINT content_reports_entity_type_check
    CHECK (entity_type IN ('post', 'comment', 'ngo', 'ngo_review', 'campaign', 'user'));

CREATE UNIQUE INDEX IF NOT EXISTS ngo_reviews_one_per_user
  ON public.ngo_reviews (ngo_id, user_id);

CREATE INDEX IF NOT EXISTS ngos_discovery_location
  ON public.ngos (profile_status, is_discoverable, state, city, category);
CREATE INDEX IF NOT EXISTS campaigns_discovery_status
  ON public.campaigns (status, category, deadline);
CREATE INDEX IF NOT EXISTS campaigns_creator_status
  ON public.campaigns (creator_id, status, created_at DESC);

CREATE OR REPLACE FUNCTION public.can_review_ngo(target_ngo_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.donations
    WHERE donations.user_id = auth.uid()
      AND donations.ngo_id = target_ngo_id
      AND donations.status = 'captured'
  ) OR EXISTS (
    SELECT 1
    FROM public.volunteer_hours
    WHERE volunteer_hours.user_id = auth.uid()
      AND volunteer_hours.ngo_id = target_ngo_id
      AND volunteer_hours.status = 'approved'
  );
$$;

REVOKE ALL ON FUNCTION public.can_review_ngo(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_review_ngo(UUID) TO authenticated;

DROP POLICY IF EXISTS "public_read_reviews" ON public.ngo_reviews;
CREATE POLICY "Public reads visible reviews"
  ON public.ngo_reviews FOR SELECT
  USING (hidden_at IS NULL);

CREATE POLICY "Admins read hidden reviews"
  ON public.ngo_reviews FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "donors_write_reviews" ON public.ngo_reviews;
CREATE POLICY "Eligible supporters create reviews"
  ON public.ngo_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.can_review_ngo(ngo_id)
  );

CREATE OR REPLACE FUNCTION public.protect_review_moderation_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin() AND (
    NEW.hidden_at IS DISTINCT FROM OLD.hidden_at OR
    NEW.hidden_reason IS DISTINCT FROM OLD.hidden_reason OR
    NEW.moderated_by IS DISTINCT FROM OLD.moderated_by
  ) THEN
    RAISE EXCEPTION 'Moderation fields are admin-managed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_review_moderation_fields ON public.ngo_reviews;
CREATE TRIGGER protect_review_moderation_fields
BEFORE UPDATE ON public.ngo_reviews
FOR EACH ROW EXECUTE FUNCTION public.protect_review_moderation_fields();

CREATE OR REPLACE FUNCTION public.transition_campaign(
  campaign_uuid UUID,
  next_status TEXT,
  decision_note TEXT DEFAULT NULL
)
RETURNS public.campaigns
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_campaign public.campaigns;
  caller_role TEXT;
  payout_status TEXT;
BEGIN
  SELECT * INTO current_campaign
  FROM public.campaigns
  WHERE id = campaign_uuid
  FOR UPDATE;

  IF current_campaign.id IS NULL THEN
    RAISE EXCEPTION 'Campaign not found';
  END IF;

  SELECT role INTO caller_role FROM public.users WHERE id = auth.uid();
  IF auth.uid() <> current_campaign.creator_id AND caller_role <> 'admin' THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF caller_role <> 'admin' AND NOT (
    (current_campaign.status = 'draft' AND next_status IN ('pending_review', 'cancelled')) OR
    (current_campaign.status = 'changes_requested' AND next_status IN ('pending_review', 'cancelled')) OR
    (current_campaign.status = 'active' AND next_status IN ('paused', 'completed', 'cancelled')) OR
    (current_campaign.status = 'paused' AND next_status IN ('active', 'completed', 'cancelled'))
  ) THEN
    RAISE EXCEPTION 'Invalid campaign transition';
  END IF;

  IF caller_role = 'admin' AND NOT (
    (current_campaign.status = 'pending_review' AND next_status IN ('changes_requested', 'rejected', 'approved')) OR
    (current_campaign.status = 'approved' AND next_status IN ('active', 'cancelled')) OR
    (current_campaign.status IN ('active', 'paused') AND next_status IN ('paused', 'active', 'completed', 'cancelled'))
  ) THEN
    RAISE EXCEPTION 'Invalid administrative transition';
  END IF;

  IF next_status = 'active' THEN
    SELECT status INTO payout_status
    FROM public.payout_accounts
    WHERE id = current_campaign.payout_account_id;

    IF payout_status IS DISTINCT FROM 'active' THEN
      RAISE EXCEPTION 'An active payout account is required';
    END IF;
  END IF;

  UPDATE public.campaigns
  SET status = next_status,
      moderation_notes = decision_note,
      approved_at = CASE WHEN next_status = 'approved' THEN NOW() ELSE approved_at END,
      published_at = CASE WHEN next_status = 'active' THEN NOW() ELSE published_at END,
      updated_at = NOW()
  WHERE id = campaign_uuid
  RETURNING * INTO current_campaign;

  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, changes)
  VALUES (
    auth.uid(),
    'campaign.transition',
    'campaign',
    campaign_uuid,
    jsonb_build_object('status', next_status, 'note', decision_note)
  );

  RETURN current_campaign;
END;
$$;

REVOKE ALL ON FUNCTION public.transition_campaign(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.transition_campaign(UUID, TEXT, TEXT) TO authenticated;
