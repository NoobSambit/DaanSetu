# Release and Deployment Workflow

This workflow describes the expected path before shipping changes.

## Local Verification

Run:

```bash
npm run typecheck
npm run lint
npm test
npm run test:coverage
npm run build
```

Run format checks when files were edited:

```bash
npm run format:check
```

Run formatting if needed:

```bash
npm run format
```

## Database Verification

For schema changes:

```bash
npm run db:migrate:dry
```

If the dry run is correct and you intend to mutate the linked project:

```bash
npm run db:push
```

After schema changes:

```bash
npm run db:types
```

## Seed Verification

For demo-data work:

```bash
npm run db:seed:remote
npm run db:seed:assets
npm run db:seed:verify
```

Do not run seed commands against production.

## Deployment Checklist

1. Confirm all required environment variables are set.
2. Apply migrations.
3. Regenerate database types if schema changed.
4. Run verification gate.
5. Confirm Supabase Auth redirect URLs.
6. Confirm private storage policies.
7. Confirm PayPal webhook URL and webhook ID.
8. Confirm `ENABLE_DEMO_PAYMENTS=false`.
9. Confirm production PayPal environment only after approval.
10. Smoke test auth, payment, webhook, refund, payout, and admin review flows.

