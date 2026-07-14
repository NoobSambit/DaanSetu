-- Migration 023: public discovery flags and query-support indexes.

ALTER TABLE public.ngos
  ADD COLUMN IF NOT EXISTS accepts_csr BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS ngos_discovery_capabilities
  ON public.ngos (
    profile_status,
    is_discoverable,
    is_verified,
    accepts_volunteers,
    accepts_csr
  );

CREATE INDEX IF NOT EXISTS donations_public_impact
  ON public.donations (status, is_demo, captured_at DESC)
  WHERE status = 'captured' AND is_demo = FALSE;

CREATE INDEX IF NOT EXISTS posts_featured_impact
  ON public.posts (featured_at DESC)
  WHERE status = 'published'
    AND is_impact_story = TRUE
    AND approved_at IS NOT NULL
    AND featured_at IS NOT NULL
    AND hidden_at IS NULL;
