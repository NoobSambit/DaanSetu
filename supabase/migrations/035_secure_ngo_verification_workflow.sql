-- Migration 035: atomic NGO verification submission, review, and expiry.

ALTER TABLE public.ngos
  ADD COLUMN IF NOT EXISTS tax_exemption_80g BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE public.ngo_verifications
SET verification_status = 'submitted'
WHERE verification_status = 'pending';

ALTER TABLE public.ngo_verifications
  DROP CONSTRAINT IF EXISTS ngo_verifications_verification_status_check,
  ADD CONSTRAINT ngo_verifications_verification_status_check CHECK (
    verification_status IN (
      'draft',
      'submitted',
      'changes_requested',
      'verified',
      'rejected',
      'expired'
    )
  );

DROP INDEX IF EXISTS public.idx_ngo_verifications_one_current;
CREATE UNIQUE INDEX idx_ngo_verifications_one_current
  ON public.ngo_verifications (ngo_id)
  WHERE verification_status IN (
    'draft',
    'submitted',
    'changes_requested',
    'verified'
  );

DROP POLICY IF EXISTS "Owners update verification drafts"
  ON public.ngo_verifications;
CREATE POLICY "Owners update editable verification records"
  ON public.ngo_verifications FOR UPDATE TO authenticated
  USING (
    verification_status IN ('draft', 'changes_requested', 'rejected')
    AND EXISTS (
      SELECT 1
      FROM public.ngos
      WHERE ngos.id = ngo_verifications.ngo_id
        AND ngos.user_id = auth.uid()
    )
  )
  WITH CHECK (
    verification_status IN ('draft', 'changes_requested', 'rejected')
    AND EXISTS (
      SELECT 1
      FROM public.ngos
      WHERE ngos.id = ngo_verifications.ngo_id
        AND ngos.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners add verification documents"
  ON public.ngo_verification_documents;
CREATE POLICY "Owners add editable verification documents"
  ON public.ngo_verification_documents FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.ngos
      WHERE ngos.id = ngo_verification_documents.ngo_id
        AND ngos.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1
      FROM public.ngo_verifications
      WHERE ngo_verifications.id = ngo_verification_documents.verification_id
        AND ngo_verifications.ngo_id = ngo_verification_documents.ngo_id
        AND ngo_verifications.verification_status IN (
          'draft',
          'changes_requested',
          'rejected'
        )
    )
  );

DROP POLICY IF EXISTS "Owners delete draft verification documents"
  ON public.ngo_verification_documents;
CREATE POLICY "Owners delete editable verification documents"
  ON public.ngo_verification_documents FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.ngos
      WHERE ngos.id = ngo_verification_documents.ngo_id
        AND ngos.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1
      FROM public.ngo_verifications
      WHERE ngo_verifications.id = ngo_verification_documents.verification_id
        AND ngo_verifications.verification_status IN (
          'draft',
          'changes_requested',
          'rejected'
        )
    )
  );

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check,
  ADD CONSTRAINT notifications_type_check CHECK (
    type IN (
      'campaign_milestone',
      'volunteer_accepted',
      'volunteer_application',
      'volunteer_hours',
      'volunteer_certificate',
      'badge_unlocked',
      'post_liked',
      'post_commented',
      'partnership_accepted',
      'donation_captured',
      'subscription_changed',
      'refund_changed',
      'payout_changed',
      'campaign_decision',
      'moderation_decision',
      'csr_invitation',
      'ngo_verification'
    )
  );

-- Legacy rows must not imply 80G eligibility merely because the old column
-- defaulted to true. Eligibility is derived from a verified submission.
UPDATE public.ngos
SET tax_exemption_80g = FALSE;

UPDATE public.ngos
SET tax_exemption_80g = TRUE
WHERE EXISTS (
  SELECT 1
  FROM public.ngo_verifications
  WHERE ngo_verifications.ngo_id = ngos.id
    AND ngo_verifications.verification_status = 'verified'
    AND ngo_verifications.has_80g = TRUE
);

CREATE OR REPLACE FUNCTION public.submit_ngo_verification(
  verification_uuid UUID
)
RETURNS public.ngo_verifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  verification_record public.ngo_verifications;
  result public.ngo_verifications;
BEGIN
  SELECT * INTO verification_record
  FROM public.ngo_verifications
  WHERE id = verification_uuid
  FOR UPDATE;

  IF verification_record.id IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.ngos
    WHERE ngos.id = verification_record.ngo_id
      AND ngos.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Verification record not found';
  END IF;

  IF verification_record.verification_status NOT IN (
    'draft',
    'changes_requested',
    'rejected'
  ) THEN
    RAISE EXCEPTION 'Verification record is not editable';
  END IF;

  IF NULLIF(btrim(verification_record.legal_name), '') IS NULL
    OR NULLIF(btrim(verification_record.registration_number), '') IS NULL
    OR NULLIF(btrim(verification_record.registration_type), '') IS NULL
  THEN
    RAISE EXCEPTION 'Required legal details are incomplete';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.ngo_verification_documents
    WHERE verification_id = verification_record.id
  ) THEN
    RAISE EXCEPTION 'At least one verification document is required';
  END IF;

  UPDATE public.ngo_verifications
  SET verification_status = 'submitted',
      submitted_at = NOW(),
      reviewed_at = NULL,
      verified_by = NULL,
      verification_date = NULL,
      verification_notes = NULL,
      documents_verified = FALSE,
      updated_at = NOW()
  WHERE id = verification_record.id
  RETURNING * INTO result;

  INSERT INTO public.audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    changes
  ) VALUES (
    auth.uid(),
    'ngo_verification.submitted',
    'ngo_verification',
    result.id,
    jsonb_build_object('status', 'submitted', 'ngoId', result.ngo_id)
  );

  INSERT INTO public.notifications (user_id, type, title, message, link)
  SELECT
    users.id,
    'ngo_verification',
    'NGO verification submitted',
    'A new NGO verification request is ready for review.',
    '/admin/ngo-verifications'
  FROM public.users
  WHERE users.role = 'admin';

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_ngo_verification(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_ngo_verification(UUID)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.review_ngo_verification(
  verification_uuid UUID,
  next_status TEXT,
  decision_note TEXT
)
RETURNS public.ngo_verifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  verification_record public.ngo_verifications;
  result public.ngo_verifications;
  ngo_owner UUID;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT * INTO verification_record
  FROM public.ngo_verifications
  WHERE id = verification_uuid
  FOR UPDATE;

  IF verification_record.id IS NULL THEN
    RAISE EXCEPTION 'Verification record not found';
  END IF;

  IF NOT (
    verification_record.verification_status = 'submitted'
      AND next_status IN ('changes_requested', 'verified', 'rejected')
  ) AND NOT (
    verification_record.verification_status = 'verified'
      AND next_status = 'expired'
  ) THEN
    RAISE EXCEPTION 'Invalid verification transition';
  END IF;

  IF next_status <> 'verified'
    AND NULLIF(btrim(decision_note), '') IS NULL
  THEN
    RAISE EXCEPTION 'A decision note is required';
  END IF;

  IF next_status = 'verified' AND NOT EXISTS (
    SELECT 1
    FROM public.ngo_verification_documents
    WHERE verification_id = verification_record.id
  ) THEN
    RAISE EXCEPTION 'Verification documents are required';
  END IF;

  UPDATE public.ngo_verifications
  SET verification_status = next_status,
      verified_by = auth.uid(),
      verification_date = CASE
        WHEN next_status = 'verified' THEN NOW()
        ELSE verification_date
      END,
      reviewed_at = NOW(),
      verification_notes = NULLIF(btrim(decision_note), ''),
      documents_verified = next_status = 'verified',
      updated_at = NOW()
  WHERE id = verification_record.id
  RETURNING * INTO result;

  UPDATE public.ngos
  SET is_verified = next_status = 'verified',
      tax_exemption_80g = (
        next_status = 'verified' AND result.has_80g = TRUE
      ),
      updated_at = NOW()
  WHERE id = result.ngo_id
  RETURNING user_id INTO ngo_owner;

  INSERT INTO public.audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    changes
  ) VALUES (
    auth.uid(),
    'ngo_verification.reviewed',
    'ngo_verification',
    result.id,
    jsonb_build_object(
      'previousStatus',
      verification_record.verification_status,
      'status',
      next_status,
      'note',
      NULLIF(btrim(decision_note), '')
    )
  );

  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (
    ngo_owner,
    'ngo_verification',
    'NGO verification updated',
    CASE next_status
      WHEN 'verified' THEN 'Your organization verification was approved.'
      WHEN 'changes_requested' THEN 'Changes were requested for your verification submission.'
      WHEN 'expired' THEN 'Your organization verification has expired.'
      ELSE 'Your organization verification was rejected.'
    END,
    '/ngo/profile'
  );

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.review_ngo_verification(UUID, TEXT, TEXT)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_ngo_verification(UUID, TEXT, TEXT)
  TO authenticated;
