# Campaign Fundraising

Campaigns are fundraising records attached to an NGO or supporter campaign creator. They support draft editing, admin review, public discovery, donation progress, evidence, milestones, updates, and lifecycle transitions.

## Routes

- `/campaigns`
- `/campaigns/create`
- `/campaigns/[id]`
- `/campaigns/[id]/manage`
- `/campaigns/[id]/updates`
- `/admin/fundraisers`

## Main Data Records

- `campaigns`
- `campaign_updates`
- `campaign_milestones`
- `donations`
- `payout_accounts`
- `notifications`
- `audit_logs`

## Campaign Types

DaanSetu supports:

- NGO-created campaigns.
- Supporter-created fundraisers.
- Corporate campaigns in the CSR area.

Supporter fundraisers have extra evidence and admin-review expectations because they may involve beneficiary consent and cost estimates.

## Campaign Lifecycle

Common campaign states include:

- Draft.
- Pending review.
- Changes requested.
- Rejected.
- Approved.
- Active.
- Paused.
- Completed.
- Cancelled.

The exact state transitions are enforced through server actions and database functions such as `transition_campaign`.

## Draft Management

Campaign owners can use `/campaigns/[id]/manage` to:

- Edit draft details.
- Upload private evidence.
- Manage milestones.
- Request publication or transition state.

The server action validates owner access and avoids browser-only database writes.

## Campaign Evidence

Campaign evidence is stored in a private bucket. Evidence can include:

- Project plans.
- Beneficiary consent.
- Cost estimates.
- Supporting documents.

Private evidence is not directly exposed through public object URLs.

## Campaign Milestones

Milestones use integer paise targets. They can trigger notifications when achieved. Public users can read active campaign milestones where the campaign is public.

## Campaign Updates

Campaign owners can publish updates. Updates use the current columns `text`, `image_url`, and `created_at`.

## Admin Fundraiser Review

Admins review supporter fundraisers in `/admin/fundraisers`. The review should be done through the admin action and `transition_campaign` RPC so owners are notified and the audit trail stays intact.

## Money Rules

- Store goals as integer paise.
- Store raised/current totals as integer paise.
- Use net donation totals after refunds.
- Do not count demo payments as real campaign progress.

