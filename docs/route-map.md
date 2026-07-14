# Route Map

This route map describes the current App Router surface.

## Public Pages

| Route | Purpose |
| --- | --- |
| `/` | Landing page with impact, causes, trust, and discovery entry points. |
| `/ngos` | Public NGO directory with filters. |
| `/ngos/[id]` | Public NGO profile with programs, updates, gallery, campaigns, volunteer opportunities, reviews, and follow controls. |
| `/campaigns` | Public campaign directory. |
| `/campaigns/[id]` | Campaign detail page with progress, supporters, donation entry, payout readiness cues, and updates. |
| `/campaigns/[id]/updates` | Campaign update history and owner update form. |
| `/csr-campaigns` | Public CSR campaign discovery. |
| `/analytics` | Public impact analytics. |
| `/leaderboard` | Public giving and volunteer leaderboards. |
| `/map` | NGO map view. |
| `/impact-stories` | Public impact story feed. |
| `/community` | Public community feed. |
| `/community/[id]` | Community post detail, comments, likes, bookmarks, and reports. |
| `/profile/[userId]` | Public user profile. |
| `/terms` | Terms page. |
| `/privacy` | Privacy page. |
| `/refund-policy` | Refund policy page. |
| `/grievance` | Grievance page. |

## Authentication Pages

| Route | Purpose |
| --- | --- |
| `/sign-in` and `/auth/signin` | Sign-in page. |
| `/sign-up` and `/auth/signup` | Sign-up page. |
| `/auth/login` | Alternate login route. |
| `/auth/callback` | Supabase Auth callback route. |
| `/forgot-password` | Password reset request. |
| `/reset-password` | Password reset completion. |
| `/check-email` | Email verification and reset instruction page. |

## Supporter Dashboard

| Route | Purpose |
| --- | --- |
| `/dashboard` | Supporter summary dashboard. |
| `/dashboard/activity` | User activity. |
| `/dashboard/bookmarks` | Saved community posts. |
| `/dashboard/giving` | Donations, subscriptions, refunds, receipts, and tax profile entry. |
| `/dashboard/giving/financial-year` | Financial-year donation data API route. |
| `/dashboard/impact` | Supporter impact charts. |
| `/dashboard/profile/edit` | Public profile edit form. |
| `/dashboard/security` | Account security and global session revocation. |

## NGO Routes

| Route | Purpose |
| --- | --- |
| `/ngo/profile` | NGO onboarding, profile editing, document upload, and verification submission. |
| `/ngo/dashboard` | NGO dashboard overview. |
| `/ngo/dashboard/analytics` | NGO analytics and impact report download. |
| `/ngo/dashboard/payouts` | Payout recipient submission and payout transfer status. |
| `/ngo/dashboard/tax` | Form 10BE upload and tax-document management. |
| `/ngo/dashboard/tax/10bd` | Form 10BD export route. |
| `/ngo/dashboard/volunteers` | Volunteer opportunities, application review, and hour review. |

## Campaign Owner Routes

| Route | Purpose |
| --- | --- |
| `/campaigns/create` | NGO or supporter campaign creation. |
| `/campaigns/[id]/manage` | Draft editing, evidence upload, milestone management, and campaign transitions. |

## Volunteer Routes

| Route | Purpose |
| --- | --- |
| `/volunteer/profile` | Volunteer profile creation and editing. |
| `/volunteer/opportunities` | Opportunity discovery and application. |
| `/volunteer/dashboard` | Applications, hours, skill verifications, and certificates. |

## Corporate Routes

| Route | Purpose |
| --- | --- |
| `/corporate/profile` | Corporate profile setup and editing. |
| `/corporate/dashboard` | Corporate dashboard. |
| `/corporate/employees` | Employee list and invitations. |
| `/corporate/invitations/[token]` | Invitation acceptance. |
| `/corporate/campaigns` | Corporate campaign list. |
| `/corporate/campaigns/create` | Corporate campaign creation. |
| `/corporate/campaigns/[id]` | Corporate campaign details and partnership requests. |
| `/corporate/settlements` | CSR settlement creation and payment entry. |
| `/corporate/settlements/paypal-return` | PayPal return page that captures settlement by POST. |
| `/corporate/settlements/paypal-cancel` | PayPal cancellation page. |

## Admin Routes

| Route | Purpose |
| --- | --- |
| `/admin/operations` | Admin operations hub. |
| `/admin/analytics` | Platform analytics. |
| `/admin/audit` | Audit log review. |
| `/admin/ai-flags` | AI moderation flags. |
| `/admin/csr-settlements` | CSR settlement records. |
| `/admin/fundraisers` | Supporter fundraiser review. |
| `/admin/moderation` | Content report and impact-story moderation. |
| `/admin/ngo-verifications` | NGO verification review. |
| `/admin/payouts` | Payout account review and payout reconciliation. |
| `/admin/refunds` | Refund request review and refund reconciliation. |

