-- Migration 032: secure campaign editing, milestones, and achievement notices.

ALTER TABLE public.campaign_milestones
  ADD COLUMN IF NOT EXISTS target_paise BIGINT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE public.campaign_milestones
SET target_paise = ROUND(target_amount * 100)::BIGINT
WHERE target_paise IS NULL;

ALTER TABLE public.campaign_milestones
  ALTER COLUMN target_paise SET NOT NULL,
  DROP CONSTRAINT IF EXISTS campaign_milestones_target_paise_positive,
  ADD CONSTRAINT campaign_milestones_target_paise_positive
    CHECK (target_paise > 0),
  DROP COLUMN IF EXISTS target_amount;

ALTER TABLE public.campaign_milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reads active campaign milestones"
  ON public.campaign_milestones;
CREATE POLICY "Public reads active campaign milestones"
  ON public.campaign_milestones FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1
      FROM public.campaigns
      WHERE campaigns.id = campaign_milestones.campaign_id
        AND campaigns.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Authenticated users read visible or owned milestones"
  ON public.campaign_milestones;
CREATE POLICY "Authenticated users read visible or owned milestones"
  ON public.campaign_milestones FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.campaigns
      WHERE campaigns.id = campaign_milestones.campaign_id
        AND (
          campaigns.status = 'active'
          OR campaigns.creator_id = auth.uid()
          OR public.is_admin()
        )
    )
  );

DROP POLICY IF EXISTS "Campaign owners manage milestones"
  ON public.campaign_milestones;
CREATE POLICY "Campaign owners manage milestones"
  ON public.campaign_milestones FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.campaigns
      WHERE campaigns.id = campaign_milestones.campaign_id
        AND campaigns.creator_id = auth.uid()
        AND campaigns.status IN ('draft', 'changes_requested')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.campaigns
      WHERE campaigns.id = campaign_milestones.campaign_id
        AND campaigns.creator_id = auth.uid()
        AND campaigns.status IN ('draft', 'changes_requested')
        AND campaign_milestones.target_paise <= campaigns.target_paise
    )
  );

REVOKE ALL ON public.campaign_milestones FROM anon;
REVOKE ALL ON public.campaign_milestones FROM authenticated;
GRANT SELECT ON public.campaign_milestones TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_milestones
  TO authenticated;

CREATE INDEX IF NOT EXISTS campaign_milestones_pending_target
  ON public.campaign_milestones (campaign_id, target_paise)
  WHERE achieved = FALSE;

DROP TRIGGER IF EXISTS campaign_milestones_updated_at
  ON public.campaign_milestones;
CREATE TRIGGER campaign_milestones_updated_at
BEFORE UPDATE ON public.campaign_milestones
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.achieve_campaign_milestones()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  achieved_milestone RECORD;
BEGIN
  IF NEW.raised_paise <= OLD.raised_paise THEN
    RETURN NEW;
  END IF;

  FOR achieved_milestone IN
    UPDATE public.campaign_milestones
    SET achieved = TRUE,
        achieved_at = NOW(),
        updated_at = NOW()
    WHERE campaign_id = NEW.id
      AND achieved = FALSE
      AND target_paise <= NEW.raised_paise
    RETURNING id, title
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, link)
    SELECT
      recipients.user_id,
      'campaign_milestone',
      'Campaign milestone reached',
      NEW.title || ' reached: ' || achieved_milestone.title,
      '/campaigns/' || NEW.id::TEXT
    FROM (
      SELECT NEW.creator_id AS user_id
      UNION
      SELECT follows.follower_id
      FROM public.follows
      WHERE follows.following_type = 'ngo'
        AND NEW.ngo_id IS NOT NULL
        AND follows.following_id = NEW.ngo_id
    ) AS recipients
    WHERE recipients.user_id IS NOT NULL;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS achieve_campaign_milestones_on_progress
  ON public.campaigns;
CREATE TRIGGER achieve_campaign_milestones_on_progress
AFTER UPDATE OF raised_paise ON public.campaigns
FOR EACH ROW EXECUTE FUNCTION public.achieve_campaign_milestones();

REVOKE ALL ON FUNCTION public.achieve_campaign_milestones() FROM PUBLIC;
