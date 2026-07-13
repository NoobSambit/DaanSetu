-- Migration 020: complete volunteer ownership, community moderation, and realtime publication.

DROP POLICY IF EXISTS "Users apply to opportunities" ON public.volunteer_applications;
CREATE POLICY "Users apply to active opportunities"
  ON public.volunteer_applications FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND status = 'submitted'
    AND EXISTS (
      SELECT 1 FROM public.volunteer_opportunities
      WHERE volunteer_opportunities.id = opportunity_id
        AND volunteer_opportunities.status = 'active'
    )
  );

CREATE POLICY "Users update submitted applications"
  ON public.volunteer_applications FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status IN ('submitted', 'shortlisted'))
  WITH CHECK (user_id = auth.uid() AND status = 'withdrawn');

CREATE POLICY "NGO owners review applications"
  ON public.volunteer_applications FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.volunteer_opportunities
      JOIN public.ngos ON ngos.id = volunteer_opportunities.ngo_id
      WHERE volunteer_opportunities.id = opportunity_id
        AND ngos.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "users_log_hours" ON public.volunteer_hours;
CREATE POLICY "Accepted volunteers submit hours"
  ON public.volunteer_hours FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND status = 'pending'
    AND EXISTS (
      SELECT 1 FROM public.volunteer_applications
      WHERE volunteer_applications.opportunity_id = volunteer_hours.opportunity_id
        AND volunteer_applications.user_id = auth.uid()
        AND volunteer_applications.status = 'accepted'
    )
  );

CREATE POLICY "NGO owners review hours"
  ON public.volunteer_hours FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ngos WHERE ngos.id = ngo_id AND ngos.user_id = auth.uid()));

ALTER TABLE public.volunteer_certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Volunteers read certificates"
  ON public.volunteer_certificates FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Anyone can view posts" ON public.posts;
CREATE POLICY "Public reads visible published posts"
  ON public.posts FOR SELECT
  USING (status = 'published' AND hidden_at IS NULL);

CREATE POLICY "Users report content"
  ON public.content_reports FOR INSERT TO authenticated
  WITH CHECK (reported_by = auth.uid() AND status = 'pending');
CREATE POLICY "Reporters read own reports"
  ON public.content_reports FOR SELECT TO authenticated
  USING (reported_by = auth.uid() OR public.is_admin());

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.donations;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.campaigns;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.volunteer_applications;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
