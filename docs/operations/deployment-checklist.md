# Deployment Checklist

Use this before production or serious staging deployment.

## Environment

- Set all required Supabase variables.
- Set all required PayPal variables.
- Set `NEXT_PUBLIC_APP_URL` to the deployed URL.
- Set `ENABLE_DEMO_PAYMENTS=false`.
- Keep service-role, PayPal secret, webhook ID, and encryption key server-only.

## Supabase

- Apply all migrations.
- Regenerate database types.
- Confirm RLS policies.
- Confirm private bucket policies.
- Confirm public bucket policies.
- Confirm Supabase Auth redirect URLs.

## PayPal

- Confirm sandbox or live environment.
- Register the webhook URL.
- Set the matching `PAYPAL_WEBHOOK_ID`.
- Test order creation.
- Test capture.
- Test duplicate webhook delivery.
- Test refund.
- Test subscription event.
- Test CSR settlement.

## App Verification

Run:

```bash
npm run typecheck
npm run lint
npm test
npm run test:coverage
npm run build
npm audit --omit=dev
```

## Manual Smoke Checks

- Sign up and verify email.
- Sign in as supporter.
- Sign in as NGO.
- Sign in as corporate.
- Sign in as admin.
- Browse NGO directory.
- Browse campaigns.
- Complete sandbox donation.
- Confirm webhook reconciliation.
- Request and review refund.
- Submit NGO verification and review it.
- Create volunteer opportunity and review application.
- Publish and moderate community content.
- Create CSR settlement and capture it.

