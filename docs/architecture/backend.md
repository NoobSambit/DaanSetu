# Backend Architecture

The backend is implemented through Next.js server actions, route handlers, Supabase RPCs, RLS, storage policies, and external provider clients.

## Server Actions

Server actions handle form-based mutations. They are good for:

- Auth form actions.
- Profile saves.
- Campaign changes.
- Community actions.
- Volunteer review.
- Admin decisions.

Critical actions should call database functions instead of doing many separate client-side table updates.

## Route Handlers

Route handlers under `app/api` are used for:

- PayPal order creation and capture.
- Webhooks.
- Subscription handling.
- CSR settlements.
- Document downloads.
- Image upload.
- AI endpoints.
- Utility status checks.

## Supabase Clients

`createServerClient` uses user cookies and is appropriate for user-scoped reads and writes.

`createAdminClient` uses the service-role key and is server-only. Use it only when the code must bypass RLS for controlled backend work.

## Database RPCs

Important database functions include:

- `record_completed_payment`
- `record_completed_subscription_payment`
- `complete_paypal_refund`
- `review_refund_request`
- `review_payout_account`
- `reconcile_paypal_payout_transfer`
- `submit_ngo_verification`
- `review_ngo_verification`
- `transition_campaign`
- `review_volunteer_application`
- `review_volunteer_hours`
- `moderate_reported_content`
- `review_impact_story`
- `create_csr_settlement_batch`
- `capture_csr_settlement`
- `reverse_csr_settlement`

## External Providers

### PayPal

PayPal handles provider payment operations. DaanSetu still validates amounts, stores provider IDs, and reconciles events idempotently.

### Gemini

Gemini supports recommendations, chat, and content analysis. The app should work without Gemini.

