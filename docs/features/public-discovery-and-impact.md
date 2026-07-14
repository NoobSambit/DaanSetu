# Public Discovery and Impact

Public discovery is the first layer of trust in DaanSetu. Visitors can inspect NGOs, campaigns, public impact, community stories, maps, and leaderboards before deciding to sign in or donate.

## Routes

- `/`
- `/ngos`
- `/ngos/[id]`
- `/campaigns`
- `/campaigns/[id]`
- `/analytics`
- `/leaderboard`
- `/map`
- `/impact-stories`
- `/csr-campaigns`

## Landing Page

The landing page is built from component sections in `components/landing/`.

Main sections:

- Hero and navigation.
- Causes.
- Feature cards.
- How it works.
- Trust section.
- Impact dashboard.
- Impact ways.
- India map.
- Story section.
- Community call-to-action.
- Footer.

The landing repository in `lib/landing/repository.ts` pulls public impact numbers and featured records from Supabase. It uses server-side data access where needed so public pages can show trusted platform-wide values.

## NGO Discovery

The NGO directory lets users find public NGOs. It uses `lib/discovery/ngos.ts` and supports filters such as:

- Search text.
- Cause.
- Location.
- Verification and discoverability states.

Public NGO profiles can show:

- Basic identity.
- Mission and description.
- Programs.
- Updates.
- Gallery images.
- Service areas.
- Active campaigns.
- Volunteer opportunities.
- Reviews.
- Follow count.
- Verification state.

## Campaign Discovery

Campaign discovery uses `lib/discovery/campaigns.ts`. Campaigns expose public details only when they are in a visible lifecycle state.

Campaign pages show:

- Campaign title and story.
- NGO or creator details.
- Goal and current progress.
- Donation controls.
- Supporter list API.
- Updates.
- Evidence and payout readiness cues where relevant.

## Public Impact Analytics

Public analytics are handled through:

- `app/analytics/page.tsx`
- `app/analytics/PublicImpactCharts.tsx`
- `lib/impact/public-analytics.ts`

The public analytics layer reads donation totals, NGO counts, campaign counts, volunteer profiles, and approved volunteer hours.

## Map

`/map` reads public NGO location fields and displays NGOs geographically. Location data should only be shown for published public NGO records.

## Leaderboards

Leaderboards use server-only aggregate logic in `lib/services/leaderboard.ts`. They avoid exposing private account email data and calculate donation totals using net non-demo transactions.

## Public Data Rules

- Draft NGO profiles should not appear in directories.
- Hidden-but-published NGO profiles may be directly viewable but not discoverable.
- Demo payments should not inflate public impact totals.
- Refunded amounts must reduce financial aggregates.
- Admin-hidden content should not appear in public feeds.

