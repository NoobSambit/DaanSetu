# Product Overview

DaanSetu is a social impact platform. It helps people discover trusted NGOs, donate to causes, volunteer their time, follow updates, and take part in community conversations. It also supports NGOs, corporate CSR teams, and platform administrators.

## Main Product Areas

### Public discovery

Visitors can browse NGOs, campaigns, impact stories, CSR campaigns, public analytics, maps, and leaderboards. These pages are meant to build trust before a user signs in.

### Supporter experience

Supporters can create an account, donate, manage giving history, request refunds, download receipts, maintain a donor tax profile, bookmark posts, follow NGOs, and view impact activity.

### NGO experience

NGOs can create a profile, upload verification documents, submit for admin review, publish a public profile, manage campaigns, upload campaign evidence, create campaign updates, handle volunteers, configure payout details, upload official Form 10BE mappings, and view analytics.

### Volunteer experience

Volunteers can create a volunteer profile, discover matching opportunities, apply, withdraw applications, submit hours, track verified skills, and download certificates.

### Community experience

Verified users can publish posts, upload media, like, comment, bookmark, follow, share, and report content. Admins can moderate content without deleting audit history.

### Corporate CSR experience

Corporate users can create corporate profiles, invite employees, create CSR campaigns, configure match initiatives, request partnerships with verified NGOs, attribute employee giving, and settle outstanding matched pledges through PayPal.

### Admin operations

Admins review NGO verification, fundraiser approval, payout account approval, refunds, AI flags, reported content, CSR settlement records, analytics, and audit logs.

## Current Backend Boundary

The current codebase uses Supabase as the backend boundary:

- Supabase Auth handles user sessions and email verification.
- Supabase PostgreSQL stores application data.
- Supabase RLS protects data access.
- Supabase Storage stores public and private files.
- Server-side routes and server actions perform privileged work.
- PayPal handles real payment provider flows.
- Gemini is optional and must always have deterministic fallback behavior.

## Important Product Rules

- Money is stored as integer paise in the application database.
- Demo payments are separate from real payment reporting.
- In-app receipts are not the same as statutory Form 10BE certificates.
- Sensitive documents stay in private buckets.
- Admin decisions should be atomic, audited, and should notify affected users.
- Public pages should only show records that are safe and approved for public use.

