-- Migration 016: public NGO profile content support
--
-- Adds the profile fields and dashboard-managed content tables needed by the
-- richer public NGO page. Dashboard CRUD screens will be built separately.

ALTER TABLE public.ngos
  ADD COLUMN IF NOT EXISTS vision TEXT,
  ADD COLUMN IF NOT EXISTS theory_of_change TEXT,
  ADD COLUMN IF NOT EXISTS core_values TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS operating_states TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS team_size INTEGER,
  ADD COLUMN IF NOT EXISTS beneficiaries_reached INTEGER,
  ADD COLUMN IF NOT EXISTS communities_served INTEGER,
  ADD COLUMN IF NOT EXISTS volunteers_engaged INTEGER;

ALTER TABLE public.ngos
  DROP CONSTRAINT IF EXISTS ngos_team_size_nonnegative,
  ADD CONSTRAINT ngos_team_size_nonnegative CHECK (team_size IS NULL OR team_size >= 0),
  DROP CONSTRAINT IF EXISTS ngos_beneficiaries_reached_nonnegative,
  ADD CONSTRAINT ngos_beneficiaries_reached_nonnegative CHECK (beneficiaries_reached IS NULL OR beneficiaries_reached >= 0),
  DROP CONSTRAINT IF EXISTS ngos_communities_served_nonnegative,
  ADD CONSTRAINT ngos_communities_served_nonnegative CHECK (communities_served IS NULL OR communities_served >= 0),
  DROP CONSTRAINT IF EXISTS ngos_volunteers_engaged_nonnegative,
  ADD CONSTRAINT ngos_volunteers_engaged_nonnegative CHECK (volunteers_engaged IS NULL OR volunteers_engaged >= 0);

CREATE TABLE IF NOT EXISTS public.ngo_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_id UUID NOT NULL REFERENCES public.ngos(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(trim(title)) BETWEEN 3 AND 140),
  summary TEXT,
  description TEXT,
  category TEXT CHECK (
    category IS NULL OR category IN (
      'education', 'food', 'health', 'women', 'animals', 'children',
      'environment', 'livelihoods', 'disability', 'disaster-relief',
      'elderly', 'human-rights', 'rural-development', 'arts-culture', 'other'
    )
  ),
  image_path TEXT,
  beneficiaries_reached INTEGER CHECK (beneficiaries_reached IS NULL OR beneficiaries_reached >= 0),
  volunteers_needed INTEGER CHECK (volunteers_needed IS NULL OR volunteers_needed >= 0),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  starts_on DATE,
  ends_on DATE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ngo_programs_ngo_status
  ON public.ngo_programs(ngo_id, status, sort_order, created_at DESC);

DROP TRIGGER IF EXISTS set_updated_at ON public.ngo_programs;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.ngo_programs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.ngo_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_id UUID NOT NULL REFERENCES public.ngos(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(trim(title)) BETWEEN 3 AND 160),
  body TEXT NOT NULL CHECK (char_length(trim(body)) >= 10),
  image_path TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ngo_updates_ngo_status
  ON public.ngo_updates(ngo_id, status, published_at DESC, created_at DESC);

DROP TRIGGER IF EXISTS set_updated_at ON public.ngo_updates;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.ngo_updates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.ngo_gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_id UUID NOT NULL REFERENCES public.ngos(id) ON DELETE CASCADE,
  image_path TEXT NOT NULL,
  alt_text TEXT,
  caption TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ngo_gallery_images_ngo_order
  ON public.ngo_gallery_images(ngo_id, sort_order, created_at DESC);

DROP TRIGGER IF EXISTS set_updated_at ON public.ngo_gallery_images;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.ngo_gallery_images
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.ngo_service_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_id UUID NOT NULL REFERENCES public.ngos(id) ON DELETE CASCADE,
  state TEXT NOT NULL,
  district TEXT,
  city TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  programs_count INTEGER CHECK (programs_count IS NULL OR programs_count >= 0),
  beneficiaries_reached INTEGER CHECK (beneficiaries_reached IS NULL OR beneficiaries_reached >= 0),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ngo_service_areas_coordinates_check CHECK (
    (latitude IS NULL AND longitude IS NULL)
    OR (
      latitude BETWEEN -90 AND 90
      AND longitude BETWEEN -180 AND 180
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_ngo_service_areas_ngo_order
  ON public.ngo_service_areas(ngo_id, sort_order, state, district);

DROP TRIGGER IF EXISTS set_updated_at ON public.ngo_service_areas;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.ngo_service_areas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.ngo_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ngo_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ngo_gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ngo_service_areas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active NGO programs" ON public.ngo_programs;
CREATE POLICY "Public can read active NGO programs"
  ON public.ngo_programs FOR SELECT TO anon, authenticated
  USING (
    status = 'active'
    AND EXISTS (
      SELECT 1 FROM public.ngos
      WHERE ngos.id = ngo_programs.ngo_id
        AND ngos.profile_status = 'published'
    )
  );

DROP POLICY IF EXISTS "NGO owners manage programs" ON public.ngo_programs;
CREATE POLICY "NGO owners manage programs"
  ON public.ngo_programs FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.ngos WHERE ngos.id = ngo_id AND ngos.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.ngos WHERE ngos.id = ngo_id AND ngos.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Public can read published NGO updates" ON public.ngo_updates;
CREATE POLICY "Public can read published NGO updates"
  ON public.ngo_updates FOR SELECT TO anon, authenticated
  USING (
    status = 'published'
    AND EXISTS (
      SELECT 1 FROM public.ngos
      WHERE ngos.id = ngo_updates.ngo_id
        AND ngos.profile_status = 'published'
    )
  );

DROP POLICY IF EXISTS "NGO owners manage updates" ON public.ngo_updates;
CREATE POLICY "NGO owners manage updates"
  ON public.ngo_updates FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.ngos WHERE ngos.id = ngo_id AND ngos.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.ngos WHERE ngos.id = ngo_id AND ngos.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Public can read NGO gallery images" ON public.ngo_gallery_images;
CREATE POLICY "Public can read NGO gallery images"
  ON public.ngo_gallery_images FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ngos
      WHERE ngos.id = ngo_gallery_images.ngo_id
        AND ngos.profile_status = 'published'
    )
  );

DROP POLICY IF EXISTS "NGO owners manage gallery images" ON public.ngo_gallery_images;
CREATE POLICY "NGO owners manage gallery images"
  ON public.ngo_gallery_images FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.ngos WHERE ngos.id = ngo_id AND ngos.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.ngos WHERE ngos.id = ngo_id AND ngos.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Public can read NGO service areas" ON public.ngo_service_areas;
CREATE POLICY "Public can read NGO service areas"
  ON public.ngo_service_areas FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ngos
      WHERE ngos.id = ngo_service_areas.ngo_id
        AND ngos.profile_status = 'published'
    )
  );

DROP POLICY IF EXISTS "NGO owners manage service areas" ON public.ngo_service_areas;
CREATE POLICY "NGO owners manage service areas"
  ON public.ngo_service_areas FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.ngos WHERE ngos.id = ngo_id AND ngos.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.ngos WHERE ngos.id = ngo_id AND ngos.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "NGO owners upload profile assets" ON storage.objects;
DROP POLICY IF EXISTS "NGO owners update profile assets" ON storage.objects;
DROP POLICY IF EXISTS "NGO owners delete profile assets" ON storage.objects;

CREATE POLICY "NGO owners upload profile assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'ngos'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
    AND (storage.foldername(name))[2] IN ('logo', 'cover', 'gallery', 'programs', 'updates')
  );

CREATE POLICY "NGO owners update profile assets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'ngos'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
    AND (storage.foldername(name))[2] IN ('logo', 'cover', 'gallery', 'programs', 'updates')
  )
  WITH CHECK (
    bucket_id = 'ngos'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
    AND (storage.foldername(name))[2] IN ('logo', 'cover', 'gallery', 'programs', 'updates')
  );

CREATE POLICY "NGO owners delete profile assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'ngos'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
    AND (storage.foldername(name))[2] IN ('logo', 'cover', 'gallery', 'programs', 'updates')
  );
