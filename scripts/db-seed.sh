#!/usr/bin/env bash
set -euo pipefail
URL="${DATABASE_URL:-postgresql://daansetu:daansetu@127.0.0.1:55432/daansetu}"
psql "$URL" -v ON_ERROR_STOP=1 <<'SQL'
INSERT INTO users (id, name, email, email_verified, role)
VALUES ('00000000-0000-4000-8000-000000000001', 'DaanSetu Demo Supporter', 'supporter@local.test', true, 'supporter')
ON CONFLICT (email) DO NOTHING;
INSERT INTO users (id, name, email, email_verified, role)
VALUES ('00000000-0000-4000-8000-000000000002', 'Pragati Foundation', 'ngo@local.test', true, 'ngo')
ON CONFLICT (email) DO NOTHING;
INSERT INTO ngo_profiles (id, owner_id, display_name, slug, description, city, state, latitude, longitude, categories, verification_status, is_discoverable, is_80g_eligible)
VALUES ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', 'Pragati Foundation', 'pragati-foundation', 'Community-led education, mentoring, and learning centres for rural girls.', 'Jaipur', 'Rajasthan', 26.9124, 75.7873, ARRAY['education','women'], 'verified', true, true)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO payout_accounts (id, owner_id, provider, gateway_account_id, status)
VALUES ('20000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', 'local', 'local_pragati', 'active')
ON CONFLICT (id) DO NOTHING;
INSERT INTO campaigns (id, creator_id, ngo_id, payout_account_id, title, short_description, story, category, target_paise, status, deadline, approved_at)
VALUES ('30000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Keep 120 Rural Girls in School', 'Fund learning materials, transport, and mentoring for one academic year.', 'This campaign funds documented school materials, safe transport, and local mentors for 120 students in rural Rajasthan. Progress and spending updates are published against campaign milestones.', 'education', 240000000, 'active', now() + interval '120 days', now())
ON CONFLICT (id) DO NOTHING;
SQL
