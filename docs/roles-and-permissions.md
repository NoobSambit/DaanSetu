# User Roles and Permissions

DaanSetu has four main account roles. Some public pages are visible without signing in, but most write actions need an authenticated and email-verified user.

## Visitor

A visitor is not signed in.

Visitors can:

- View the landing page.
- Browse public NGOs.
- Browse public campaigns.
- Read public NGO profiles.
- View public impact analytics.
- View public community content that is visible.
- Read legal pages like terms, privacy, refund policy, and grievance policy.

Visitors cannot:

- Donate through authenticated payment routes.
- Apply for volunteer opportunities.
- Post in the community.
- Follow, bookmark, like, comment, or report content.
- Access dashboards.

## Supporter

A supporter is a normal donor or community user.

Supporters can:

- Manage their profile.
- Donate to campaigns.
- Create supporter fundraisers where enabled.
- Manage giving history.
- Request refunds.
- Download receipts when allowed.
- Maintain donor tax profile data.
- Follow NGOs, users, and corporate profiles.
- Bookmark posts.
- Publish community posts after verification.
- Apply for volunteer opportunities.
- Submit volunteer hours.

Supporters cannot:

- Review NGO verifications.
- Approve fundraisers.
- Approve refunds or payout accounts.
- Manage NGO dashboards unless they also own an NGO account.
- Manage corporate CSR areas unless they are a corporate user.

## NGO

An NGO account owns one NGO profile.

NGO users can:

- Create and edit NGO profile details.
- Upload logo, cover, gallery, program, and update assets.
- Upload private verification documents.
- Submit NGO verification.
- Publish profile content when ready.
- Create and manage campaigns.
- Upload campaign evidence.
- Publish campaign updates.
- Create volunteer opportunities.
- Review volunteer applications.
- Review volunteer hours.
- See NGO donations and analytics.
- Submit payout recipient information.
- Upload official Form 10BE mappings.
- Receive partnership requests from corporate users.

NGO users cannot:

- Approve their own verification.
- Approve their own payout account.
- Mark refunds complete.
- Access admin-only audit and moderation controls.

## Corporate

A corporate user manages CSR activity for a company.

Corporate users can:

- Create and edit a corporate profile.
- Invite employees.
- Revoke pending invitations.
- Create corporate campaigns.
- Create CSR match initiatives.
- Create partnership requests with verified NGOs.
- Review partnership requests for their campaigns.
- View employee attribution and CSR metrics.
- Create PayPal-backed settlement batches for outstanding match pledges.

Corporate users cannot:

- Approve NGO verification.
- Moderate content globally.
- See private donor tax data.
- Execute admin payout decisions.

## Admin

Admins are platform operators.

Admins can:

- Review NGO verification submissions.
- Request changes, verify, reject, or expire verifications.
- Review supporter fundraisers.
- Moderate content reports.
- Review impact stories.
- Review refund requests.
- Complete PayPal refund reconciliation.
- Review payout accounts.
- Execute payout reconciliation.
- View admin analytics.
- View audit logs.
- View AI flags.
- Inspect CSR settlement records.

Admins should:

- Use audited workflows instead of direct table edits.
- Preserve history where possible.
- Prefer database RPCs for important state changes.
- Confirm payment-provider state before marking financial records complete.

