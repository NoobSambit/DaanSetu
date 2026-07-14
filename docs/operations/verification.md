# Verification

Use these checks before saying the app is ready.

## Standard Gate

```bash
npm run typecheck
npm run lint
npm test
npm run test:coverage
npm run build
```

## Formatting Gate

```bash
npm run format:check
```

Run formatting if needed:

```bash
npm run format
```

## Database Gate

For schema changes:

```bash
npm run db:migrate:dry
```

After applying schema changes:

```bash
npm run db:types
```

## Security and Dependency Gate

```bash
npm audit --omit=dev
```

## What the Test Suite Covers

The current test suite includes contract tests for:

- Authentication validation and redirects.
- NGO profile and verification workflows.
- Supabase platform boundaries.
- Security headers.
- Volunteer journeys.
- Campaign management.
- Community journeys.
- CSR operations.
- Admin decisions.
- Financial notifications.
- Dashboard integrity.
- Migration correctness.

