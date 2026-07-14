-- Migration 028: complete owner-scoped policies used by validated server actions.

CREATE POLICY "Campaign owners publish updates"
  ON public.campaign_updates FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.campaigns
      WHERE campaigns.id = campaign_updates.campaign_id
        AND campaigns.creator_id = auth.uid()
    )
  );

REVOKE UPDATE, DELETE ON public.campaign_updates FROM authenticated;
GRANT INSERT ON public.campaign_updates TO authenticated;

DROP POLICY IF EXISTS "Public reads campaigns" ON public.campaigns;
CREATE POLICY "Public reads active campaigns"
  ON public.campaigns FOR SELECT TO anon
  USING (status = 'active');
CREATE POLICY "Authenticated users read public or owned campaigns"
  ON public.campaigns FOR SELECT TO authenticated
  USING (
    status = 'active'
    OR creator_id = auth.uid()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Public reads campaign updates" ON public.campaign_updates;
CREATE POLICY "Public reads active campaign updates"
  ON public.campaign_updates FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = campaign_updates.campaign_id
        AND campaigns.status = 'active'
    )
  );
CREATE POLICY "Authenticated users read visible or owned campaign updates"
  ON public.campaign_updates FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = campaign_updates.campaign_id
        AND (
          campaigns.status = 'active'
          OR campaigns.creator_id = auth.uid()
          OR public.is_admin()
        )
    )
  );

CREATE POLICY "Campaign creators update owned drafts"
  ON public.campaigns FOR UPDATE TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());
