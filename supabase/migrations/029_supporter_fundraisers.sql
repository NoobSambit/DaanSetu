-- Migration 029: supporter-led beneficiary fundraisers and private evidence.

ALTER TABLE public.campaigns
  ALTER COLUMN ngo_id DROP NOT NULL;

DROP POLICY IF EXISTS "NGO owners create campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Published NGO users can create campaigns" ON public.campaigns;
CREATE POLICY "Verified users create owned campaign drafts"
  ON public.campaigns FOR INSERT TO authenticated
  WITH CHECK (
    creator_id = auth.uid()
    AND status = 'draft'
    AND (
      ngo_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.ngos
        WHERE ngos.id = campaigns.ngo_id
          AND ngos.user_id = auth.uid()
          AND ngos.profile_status = 'published'
      )
    )
  );

UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/octet-stream'
]
WHERE id = 'campaign-evidence';

CREATE POLICY "Admins read campaign evidence"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'campaign-evidence'
    AND public.is_admin()
  );

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
    SELECT 1 FROM auth.users
    WHERE id = caller_id AND email_confirmed_at IS NOT NULL
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
      'education', 'food', 'health', 'women', 'animals', 'disaster'
    )
  THEN
    RAISE EXCEPTION 'Invalid fundraiser details';
  END IF;

  INSERT INTO public.payout_accounts (
    owner_id,
    provider,
    status,
    beneficiary
  )
  VALUES (
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
    goal_amount,
    target_paise,
    deadline,
    image_url,
    category,
    status,
    beneficiary,
    beneficiary_consent,
    evidence
  )
  VALUES (
    NULL,
    caller_id,
    payout_id,
    campaign_title,
    campaign_short_description,
    campaign_description,
    campaign_target_paise::NUMERIC / 100,
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

REVOKE ALL ON FUNCTION public.create_supporter_campaign(
  TEXT, TEXT, TEXT, BIGINT, TIMESTAMPTZ, TEXT, TEXT, TEXT, TEXT, TEXT
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_supporter_campaign(
  TEXT, TEXT, TEXT, BIGINT, TIMESTAMPTZ, TEXT, TEXT, TEXT, TEXT, TEXT
) TO authenticated;
