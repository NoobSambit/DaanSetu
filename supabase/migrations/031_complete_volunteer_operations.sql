-- Migration 031: complete volunteer discovery, review, verified skills, and certificates.

ALTER TABLE public.volunteer_opportunities
  ADD COLUMN IF NOT EXISTS availability TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE public.volunteer_opportunities
  DROP CONSTRAINT IF EXISTS volunteer_opportunities_availability_check,
  ADD CONSTRAINT volunteer_opportunities_availability_check CHECK (
    availability <@ ARRAY['Weekdays', 'Weekends', 'Flexible']::TEXT[]
  );

ALTER TABLE public.volunteer_applications
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.skill_verifications ENABLE ROW LEVEL SECURITY;

REVOKE INSERT, UPDATE, DELETE ON public.skill_verifications FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.volunteer_certificates FROM authenticated;
GRANT SELECT ON public.skill_verifications TO authenticated;
GRANT SELECT ON public.volunteer_certificates TO authenticated;

DROP POLICY IF EXISTS "public_read_certificates" ON public.volunteer_certificates;
DROP POLICY IF EXISTS "Volunteers read certificates" ON public.volunteer_certificates;
CREATE POLICY "Certificate participants read records"
  ON public.volunteer_certificates FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.ngos
      WHERE ngos.id = volunteer_certificates.ngo_id
        AND ngos.user_id = auth.uid()
    )
  );

CREATE POLICY "Volunteers read verified skills"
  ON public.skill_verifications FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR verified_by = auth.uid()
    OR public.is_admin()
  );

CREATE POLICY "NGO owners read opportunity applications"
  ON public.volunteer_applications FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.volunteer_opportunities
      JOIN public.ngos ON ngos.id = volunteer_opportunities.ngo_id
      WHERE volunteer_opportunities.id = volunteer_applications.opportunity_id
        AND ngos.user_id = auth.uid()
    )
  );

CREATE POLICY "NGO owners read submitted hours"
  ON public.volunteer_hours FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ngos
      WHERE ngos.id = volunteer_hours.ngo_id
        AND ngos.user_id = auth.uid()
    )
  );

CREATE POLICY "NGO owners update opportunities"
  ON public.volunteer_opportunities FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ngos
      WHERE ngos.id = volunteer_opportunities.ngo_id
        AND ngos.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ngos
      WHERE ngos.id = volunteer_opportunities.ngo_id
        AND ngos.user_id = auth.uid()
    )
  );

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check,
  ADD CONSTRAINT notifications_type_check CHECK (
    type IN (
      'campaign_milestone', 'volunteer_accepted', 'volunteer_application',
      'volunteer_hours', 'volunteer_certificate', 'badge_unlocked',
      'post_liked', 'post_commented', 'partnership_accepted',
      'donation_captured', 'subscription_changed', 'refund_changed',
      'payout_changed', 'campaign_decision', 'moderation_decision',
      'csr_invitation'
    )
  );

CREATE OR REPLACE FUNCTION public.review_volunteer_application(
  application_uuid UUID,
  next_status TEXT
)
RETURNS public.volunteer_applications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  application_record public.volunteer_applications;
  opportunity_record public.volunteer_opportunities;
  result public.volunteer_applications;
BEGIN
  SELECT * INTO application_record
  FROM public.volunteer_applications
  WHERE id = application_uuid
  FOR UPDATE;

  SELECT * INTO opportunity_record
  FROM public.volunteer_opportunities
  WHERE id = application_record.opportunity_id;

  IF application_record.id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.ngos
    WHERE ngos.id = opportunity_record.ngo_id
      AND ngos.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Application not found';
  END IF;

  IF NOT (
    application_record.status = 'submitted'
      AND next_status IN ('shortlisted', 'accepted', 'rejected')
  ) AND NOT (
    application_record.status = 'shortlisted'
      AND next_status IN ('accepted', 'rejected')
  ) THEN
    RAISE EXCEPTION 'Invalid application transition';
  END IF;

  UPDATE public.volunteer_applications
  SET status = next_status,
      updated_at = NOW()
  WHERE id = application_record.id
  RETURNING * INTO result;

  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (
    result.user_id,
    CASE WHEN next_status = 'accepted'
      THEN 'volunteer_accepted'
      ELSE 'volunteer_application'
    END,
    'Volunteer application updated',
    'Your application for ' || opportunity_record.title ||
      ' is now ' || next_status || '.',
    '/volunteer/dashboard'
  );

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.review_volunteer_application(UUID, TEXT)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_volunteer_application(UUID, TEXT)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.review_volunteer_hours(
  hours_uuid UUID,
  next_status TEXT,
  decision_note TEXT DEFAULT NULL
)
RETURNS public.volunteer_hours
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  hours_record public.volunteer_hours;
  opportunity_record public.volunteer_opportunities;
  certificate_record public.volunteer_certificates;
  result public.volunteer_hours;
  approved_total NUMERIC(7, 2);
  opportunity_approved_total NUMERIC(7, 2);
  verified_skill_list TEXT[];
BEGIN
  SELECT * INTO hours_record
  FROM public.volunteer_hours
  WHERE id = hours_uuid
  FOR UPDATE;

  SELECT * INTO opportunity_record
  FROM public.volunteer_opportunities
  WHERE id = hours_record.opportunity_id;

  IF hours_record.id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.ngos
    WHERE ngos.id = hours_record.ngo_id
      AND ngos.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Hours record not found';
  END IF;

  IF hours_record.status <> 'pending'
    OR next_status NOT IN ('approved', 'rejected')
  THEN
    RAISE EXCEPTION 'Invalid hours transition';
  END IF;

  UPDATE public.volunteer_hours
  SET status = next_status,
      review_note = NULLIF(btrim(decision_note), ''),
      reviewer_id = auth.uid(),
      reviewed_at = NOW(),
      verified = next_status = 'approved',
      verified_by = CASE WHEN next_status = 'approved' THEN auth.uid() END,
      verified_at = CASE WHEN next_status = 'approved' THEN NOW() END
  WHERE id = hours_record.id
  RETURNING * INTO result;

  IF next_status = 'approved' THEN
    SELECT COALESCE(SUM(hours), 0) INTO opportunity_approved_total
    FROM public.volunteer_hours
    WHERE user_id = result.user_id
      AND opportunity_id = result.opportunity_id
      AND status = 'approved';

    INSERT INTO public.volunteer_certificates (
      user_id,
      opportunity_id,
      ngo_id,
      certificate_number,
      hours_completed,
      verified_by
    ) VALUES (
      result.user_id,
      result.opportunity_id,
      result.ngo_id,
      'DSV-' || upper(substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 16)),
      opportunity_approved_total,
      auth.uid()
    )
    ON CONFLICT (user_id, opportunity_id) DO UPDATE
    SET hours_completed = EXCLUDED.hours_completed,
        verified_by = EXCLUDED.verified_by
    RETURNING * INTO certificate_record;

    INSERT INTO public.skill_verifications (
      user_id,
      skill,
      verified_by,
      verification_type
    )
    SELECT
      result.user_id,
      required_skill,
      auth.uid(),
      'ngo_endorsement'
    FROM unnest(opportunity_record.required_skills) AS required_skill
    ON CONFLICT (user_id, skill, verified_by) DO NOTHING;

    SELECT COALESCE(SUM(hours), 0) INTO approved_total
    FROM public.volunteer_hours
    WHERE user_id = result.user_id AND status = 'approved';

    SELECT COALESCE(array_agg(DISTINCT skill ORDER BY skill), '{}')
    INTO verified_skill_list
    FROM public.skill_verifications
    WHERE user_id = result.user_id;

    UPDATE public.volunteer_profiles
    SET total_hours = approved_total,
        verified_skills = verified_skill_list,
        updated_at = NOW()
    WHERE user_id = result.user_id;

    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      result.user_id,
      'volunteer_certificate',
      'Volunteer service approved',
      'Your hours were approved and certificate ' ||
        certificate_record.certificate_number || ' is ready.',
      '/volunteer/dashboard'
    );
  ELSE
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      result.user_id,
      'volunteer_hours',
      'Volunteer hours need attention',
      COALESCE(NULLIF(btrim(decision_note), ''), 'Your submitted hours were rejected.'),
      '/volunteer/dashboard'
    );
  END IF;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.review_volunteer_hours(UUID, TEXT, TEXT)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_volunteer_hours(UUID, TEXT, TEXT)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.notify_volunteer_submission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  owner_id UUID;
  opportunity_title TEXT;
BEGIN
  IF TG_TABLE_NAME = 'volunteer_applications' THEN
    SELECT ngos.user_id, volunteer_opportunities.title
    INTO owner_id, opportunity_title
    FROM public.volunteer_opportunities
    JOIN public.ngos ON ngos.id = volunteer_opportunities.ngo_id
    WHERE volunteer_opportunities.id = NEW.opportunity_id;

    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      owner_id,
      'volunteer_application',
      'New volunteer application',
      'A volunteer applied for ' || opportunity_title || '.',
      '/ngo/dashboard/volunteers'
    );
  ELSIF TG_TABLE_NAME = 'volunteer_hours' THEN
    SELECT ngos.user_id, volunteer_opportunities.title
    INTO owner_id, opportunity_title
    FROM public.volunteer_opportunities
    JOIN public.ngos ON ngos.id = volunteer_opportunities.ngo_id
    WHERE volunteer_opportunities.id = NEW.opportunity_id;

    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      owner_id,
      'volunteer_hours',
      'Volunteer hours submitted',
      'Service hours for ' || opportunity_title || ' await review.',
      '/ngo/dashboard/volunteers'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_volunteer_application_submission
  ON public.volunteer_applications;
CREATE TRIGGER notify_volunteer_application_submission
AFTER INSERT ON public.volunteer_applications
FOR EACH ROW EXECUTE FUNCTION public.notify_volunteer_submission();

DROP TRIGGER IF EXISTS notify_volunteer_hours_submission
  ON public.volunteer_hours;
CREATE TRIGGER notify_volunteer_hours_submission
AFTER INSERT ON public.volunteer_hours
FOR EACH ROW EXECUTE FUNCTION public.notify_volunteer_submission();

CREATE INDEX IF NOT EXISTS volunteer_opportunities_discovery_idx
  ON public.volunteer_opportunities (status, city, date);
CREATE INDEX IF NOT EXISTS volunteer_applications_review_idx
  ON public.volunteer_applications (opportunity_id, status, applied_at);
CREATE INDEX IF NOT EXISTS volunteer_hours_review_idx
  ON public.volunteer_hours (ngo_id, status, date);
