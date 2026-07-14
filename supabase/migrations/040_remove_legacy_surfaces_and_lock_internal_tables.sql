-- Migration 040: remove unused generated surfaces and lock internal records.

DROP FUNCTION IF EXISTS public.award_user_badge(UUID, TEXT);
DROP FUNCTION IF EXISTS public.log_activity(UUID, TEXT, TEXT, UUID, JSONB);
DROP FUNCTION IF EXISTS public.log_analytics_event(TEXT, UUID);
DROP FUNCTION IF EXISTS public.update_search_index() CASCADE;

ALTER TABLE public.campaigns
  DROP COLUMN IF EXISTS template_id;

DROP TABLE IF EXISTS public.campaign_collaborators CASCADE;
DROP TABLE IF EXISTS public.campaign_templates CASCADE;
DROP TABLE IF EXISTS public.custom_reports CASCADE;
DROP TABLE IF EXISTS public.search_index CASCADE;
DROP TABLE IF EXISTS public.translations CASCADE;
DROP TABLE IF EXISTS public.platform_settings CASCADE;
DROP TABLE IF EXISTS public.tax_receipts CASCADE;
DROP TABLE IF EXISTS public.recurring_donations CASCADE;

ALTER TABLE public.action_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csr_match_pledges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csr_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csr_settlement_pledges ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.action_rate_limits FROM anon, authenticated;
REVOKE ALL ON TABLE public.ai_flags FROM anon, authenticated;
REVOKE ALL ON TABLE public.email_queue FROM anon, authenticated;
REVOKE ALL ON TABLE public.payment_events FROM anon, authenticated;
REVOKE ALL ON TABLE public.moderation_actions FROM anon, authenticated;
REVOKE ALL ON TABLE public.csr_match_pledges FROM anon, authenticated;
REVOKE ALL ON TABLE public.csr_settlements FROM anon, authenticated;
REVOKE ALL ON TABLE public.csr_settlement_pledges FROM anon, authenticated;
