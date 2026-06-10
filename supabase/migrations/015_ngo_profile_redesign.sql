-- Migration 015: draftable NGO profiles and private verification workflow

ALTER TABLE public.ngos
  ALTER COLUMN name DROP NOT NULL,
  ALTER COLUMN description DROP NOT NULL,
  ALTER COLUMN city DROP NOT NULL,
  ALTER COLUMN state DROP NOT NULL,
  ALTER COLUMN category DROP NOT NULL,
  ALTER COLUMN latitude DROP NOT NULL,
  ALTER COLUMN longitude DROP NOT NULL;

ALTER TABLE public.ngos DROP CONSTRAINT IF EXISTS ngos_category_check;
ALTER TABLE public.ngos
  ADD CONSTRAINT ngos_category_check CHECK (
    category IS NULL OR category IN (
      'education', 'food', 'health', 'women', 'animals', 'children',
      'environment', 'livelihoods', 'disability', 'disaster-relief',
      'elderly', 'human-rights', 'rural-development', 'arts-culture', 'other'
    )
  );

ALTER TABLE public.ngos
  ADD COLUMN IF NOT EXISTS legal_name TEXT,
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS tagline TEXT,
  ADD COLUMN IF NOT EXISTS mission TEXT,
  ADD COLUMN IF NOT EXISTS founding_year INTEGER,
  ADD COLUMN IF NOT EXISTS organization_type TEXT,
  ADD COLUMN IF NOT EXISTS logo_path TEXT,
  ADD COLUMN IF NOT EXISTS cover_image_path TEXT,
  ADD COLUMN IF NOT EXISTS address_line_1 TEXT,
  ADD COLUMN IF NOT EXISTS address_line_2 TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT 'IN',
  ADD COLUMN IF NOT EXISTS impact_areas TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS beneficiary_groups TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS program_summary TEXT,
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS public_email TEXT,
  ADD COLUMN IF NOT EXISTS public_phone TEXT,
  ADD COLUMN IF NOT EXISTS social_links JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS profile_status TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_step INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_discoverable BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS accepts_donations BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS accepts_volunteers BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE public.ngos
SET
  legal_name = COALESCE(legal_name, name),
  display_name = COALESCE(display_name, name),
  address_line_1 = COALESCE(address_line_1, city),
  country_code = COALESCE(country_code, 'IN'),
  profile_status = COALESCE(profile_status, 'published'),
  published_at = COALESCE(published_at, created_at, NOW()),
  updated_at = COALESCE(updated_at, created_at, NOW());

ALTER TABLE public.ngos
  ALTER COLUMN profile_status SET DEFAULT 'draft',
  ALTER COLUMN profile_status SET NOT NULL;

ALTER TABLE public.ngos
  DROP CONSTRAINT IF EXISTS ngos_profile_status_check,
  ADD CONSTRAINT ngos_profile_status_check CHECK (profile_status IN ('draft', 'published')),
  DROP CONSTRAINT IF EXISTS ngos_onboarding_step_check,
  ADD CONSTRAINT ngos_onboarding_step_check CHECK (onboarding_step BETWEEN 1 AND 6),
  DROP CONSTRAINT IF EXISTS ngos_founding_year_check,
  ADD CONSTRAINT ngos_founding_year_check CHECK (
    founding_year IS NULL OR founding_year BETWEEN 1800 AND 2100
  ),
  DROP CONSTRAINT IF EXISTS ngos_organization_type_check,
  ADD CONSTRAINT ngos_organization_type_check CHECK (
    organization_type IS NULL OR organization_type IN (
      'trust', 'society', 'section-8-company', 'nonprofit-company', 'other'
    )
  );

CREATE UNIQUE INDEX IF NOT EXISTS idx_ngos_one_per_user ON public.ngos(user_id);
CREATE INDEX IF NOT EXISTS idx_ngos_public_directory
  ON public.ngos(profile_status, is_discoverable, created_at DESC);

DROP TRIGGER IF EXISTS set_updated_at ON public.ngos;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.ngos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.ngo_verifications
  ADD COLUMN IF NOT EXISTS legal_name TEXT,
  ADD COLUMN IF NOT EXISTS registration_type TEXT,
  ADD COLUMN IF NOT EXISTS registration_date DATE,
  ADD COLUMN IF NOT EXISTS registered_address TEXT,
  ADD COLUMN IF NOT EXISTS pan_number TEXT,
  ADD COLUMN IF NOT EXISTS ngo_darpan_id TEXT,
  ADD COLUMN IF NOT EXISTS has_12a BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS has_80g BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS has_fcra BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

ALTER TABLE public.ngo_verifications DROP CONSTRAINT IF EXISTS ngo_verifications_verification_status_check;
ALTER TABLE public.ngo_verifications
  ADD CONSTRAINT ngo_verifications_verification_status_check
  CHECK (verification_status IN ('draft', 'pending', 'verified', 'rejected'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_ngo_verifications_one_current
  ON public.ngo_verifications(ngo_id)
  WHERE verification_status IN ('draft', 'pending');

DROP TRIGGER IF EXISTS set_updated_at ON public.ngo_verifications;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.ngo_verifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.ngo_verification_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID NOT NULL REFERENCES public.ngo_verifications(id) ON DELETE CASCADE,
  ngo_id UUID NOT NULL REFERENCES public.ngos(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (
    document_type IN ('registration', 'pan', '12a', '80g', 'fcra', 'supporting')
  ),
  storage_path TEXT NOT NULL UNIQUE,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('application/pdf', 'image/jpeg', 'image/png')),
  size_bytes BIGINT NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 10485760),
  uploaded_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ngo_verification_documents_verification
  ON public.ngo_verification_documents(verification_id, created_at);

ALTER TABLE public.ngos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view NGOs" ON public.ngos;
DROP POLICY IF EXISTS "Authenticated users can create NGOs" ON public.ngos;
DROP POLICY IF EXISTS "Users can update their own NGOs" ON public.ngos;
DROP POLICY IF EXISTS "Users can delete their own NGOs" ON public.ngos;

CREATE POLICY "Public can view published NGOs"
  ON public.ngos FOR SELECT
  TO anon, authenticated
  USING (
    profile_status = 'published'
    OR user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "NGO accounts create their own profile"
  ON public.ngos FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ngo')
  );

CREATE POLICY "Owners update their NGO profile"
  ON public.ngos FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins update NGO verification state"
  ON public.ngos FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Owners delete their NGO profile"
  ON public.ngos FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

ALTER TABLE public.ngo_verifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_verifications" ON public.ngo_verifications;
DROP POLICY IF EXISTS "ngo_owners_insert" ON public.ngo_verifications;

CREATE POLICY "Owners read verification submissions"
  ON public.ngo_verifications FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.ngos WHERE ngos.id = ngo_id AND ngos.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Owners create verification drafts"
  ON public.ngo_verifications FOR INSERT TO authenticated
  WITH CHECK (
    verification_status = 'draft'
    AND EXISTS (SELECT 1 FROM public.ngos WHERE ngos.id = ngo_id AND ngos.user_id = auth.uid())
  );
CREATE POLICY "Owners update verification drafts"
  ON public.ngo_verifications FOR UPDATE TO authenticated
  USING (
    verification_status IN ('draft', 'rejected')
    AND EXISTS (SELECT 1 FROM public.ngos WHERE ngos.id = ngo_id AND ngos.user_id = auth.uid())
  );
CREATE POLICY "Admins review verification submissions"
  ON public.ngo_verifications FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

ALTER TABLE public.ngo_verification_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners and admins read verification documents"
  ON public.ngo_verification_documents FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.ngos WHERE ngos.id = ngo_id AND ngos.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Owners add verification documents"
  ON public.ngo_verification_documents FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (SELECT 1 FROM public.ngos WHERE ngos.id = ngo_id AND ngos.user_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.ngo_verifications
      WHERE id = verification_id AND ngo_id = ngo_verification_documents.ngo_id
        AND verification_status IN ('draft', 'rejected')
    )
  );
CREATE POLICY "Owners delete draft verification documents"
  ON public.ngo_verification_documents FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.ngos WHERE ngos.id = ngo_id AND ngos.user_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.ngo_verifications
      WHERE id = verification_id AND verification_status IN ('draft', 'rejected')
    )
  );

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ngo-verification', 'ngo-verification', FALSE, 10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "NGO owners upload verification files" ON storage.objects;
DROP POLICY IF EXISTS "NGO owners read verification files" ON storage.objects;
DROP POLICY IF EXISTS "NGO owners delete verification files" ON storage.objects;
DROP POLICY IF EXISTS "Admins read verification files" ON storage.objects;

CREATE POLICY "NGO owners upload verification files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'ngo-verification'
    AND EXISTS (
      SELECT 1 FROM public.ngos
      WHERE ngos.id::TEXT = (storage.foldername(name))[1] AND ngos.user_id = auth.uid()
    )
  );
CREATE POLICY "NGO owners read verification files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'ngo-verification'
    AND EXISTS (
      SELECT 1 FROM public.ngos
      WHERE ngos.id::TEXT = (storage.foldername(name))[1] AND ngos.user_id = auth.uid()
    )
  );
CREATE POLICY "NGO owners delete verification files"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'ngo-verification'
    AND EXISTS (
      SELECT 1 FROM public.ngos
      WHERE ngos.id::TEXT = (storage.foldername(name))[1] AND ngos.user_id = auth.uid()
    )
  );
CREATE POLICY "Admins read verification files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'ngo-verification'
    AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "NGO users can create campaigns" ON public.campaigns;
CREATE POLICY "Published NGO users can create campaigns"
  ON public.campaigns FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ngos
      WHERE ngos.id = campaigns.ngo_id
        AND ngos.user_id = auth.uid()
        AND ngos.profile_status = 'published'
    )
  );

DROP POLICY IF EXISTS "NGO users can create volunteer opportunities" ON public.volunteer_opportunities;
CREATE POLICY "Published NGO users can create volunteer opportunities"
  ON public.volunteer_opportunities FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ngos
      WHERE ngos.id = volunteer_opportunities.ngo_id
        AND ngos.user_id = auth.uid()
        AND ngos.profile_status = 'published'
    )
  );
