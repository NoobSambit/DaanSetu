# Security Model

DaanSetu uses layered security. No single layer is trusted to do everything.

## Layers

1. Supabase Auth identifies the user.
2. Server actions and route handlers validate input and session state.
3. RLS limits table access.
4. Database RPCs make important state changes atomic.
5. Private storage keeps sensitive files away from public URLs.
6. Encryption protects sensitive document bytes.
7. Origin checks and rate limits protect sensitive mutations.
8. Audit logs preserve admin and financial decision history.

## Sensitive Secrets

Never expose these to browser code:

- `SUPABASE_SERVICE_ROLE_KEY`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_WEBHOOK_ID`
- `FILE_ENCRYPTION_KEY`
- `SUPABASE_ACCESS_TOKEN`

## Sensitive Data

Treat these as sensitive:

- NGO verification documents.
- Campaign evidence.
- Donor tax profiles.
- Tax certificates.
- Payment provider identifiers.
- Refund records.
- Payout records.
- Admin audit details.

## Payment Safety

Payment routes must:

- Validate session.
- Validate amount server-side.
- Store provider IDs.
- Verify webhook identity.
- Handle duplicate webhooks safely.
- Keep demo payments separate.
- Reduce totals after refunds.

## Admin Safety

Admin workflows should:

- Use RPCs.
- Write audit logs.
- Notify affected users.
- Preserve history.
- Avoid direct table edits during normal operation.

