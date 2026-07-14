# DaanSetu

DaanSetu is a donation, volunteering, NGO discovery, community, and CSR platform for India-focused social impact work. It connects supporters, verified NGOs, volunteers, corporate CSR teams, and administrators in one Supabase-backed Next.js application.

The app is not just a landing page. It has real product areas for public discovery, supporter giving, NGO operations, volunteer management, corporate CSR matching, community posts, moderation, refunds, payouts, tax-document handling, AI recommendations, analytics, and audit trails.

## Documentation

The full documentation has been rebuilt under [docs/README.md](docs/README.md).

Start here:

- [Project overview](docs/product-overview.md)
- [Quick start](docs/getting-started/quick-start.md)
- [Feature index](docs/features/README.md)
- [Workflow index](docs/workflows/README.md)
- [Architecture overview](docs/architecture/overview.md)
- [API reference](docs/api/README.md)
- [Security model](docs/security/security-model.md)
- [Operations guide](docs/operations/README.md)

## Tech Stack

- Next.js 16 with the App Router
- React 19
- TypeScript
- Tailwind CSS
- Supabase Auth, PostgreSQL, Storage, Realtime, and Row Level Security
- PayPal Orders, Subscriptions, Refunds, Webhooks, and payout reconciliation
- Gemini for optional AI support, with deterministic fallback behavior
- Node's built-in test runner

## Local Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Fill the Supabase, PayPal, app URL, encryption, and optional Gemini values in `.env`. See [environment variables](docs/operations/environment-variables.md) for the full explanation.

Run the app:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Main Commands

```bash
npm run dev
npm run typecheck
npm run lint
npm test
npm run test:coverage
npm run build
npm run format
npm run format:check
```

Database and seed commands:

```bash
npm run db:migrate:dry
npm run db:push
npm run db:types
npm run db:seed:remote
npm run db:seed:assets
npm run db:seed:verify
```

The current codebase uses Supabase as the active backend boundary. Migrations live in `supabase/migrations/`, generated types live in `lib/types/database.types.ts`, and server-only privileged access goes through `lib/supabase/admin.ts`.

## Key Routes

- `/` - landing page and live impact highlights
- `/ngos` - NGO discovery
- `/ngos/[id]` - public NGO profile
- `/campaigns` - campaign discovery
- `/campaigns/[id]` - campaign detail and giving entry point
- `/dashboard` - supporter dashboard
- `/dashboard/giving` - donations, subscriptions, refunds, receipts, and donor tax profile
- `/volunteer/opportunities` - public volunteer opportunity discovery
- `/volunteer/dashboard` - volunteer applications, hours, skills, and certificates
- `/ngo/profile` - NGO onboarding and verification submission
- `/ngo/dashboard` - NGO operations
- `/corporate/dashboard` - corporate CSR dashboard
- `/corporate/settlements` - CSR settlement flow
- `/community` - community feed
- `/admin/operations` - admin operations hub

## Verification Gate

Before calling a change ready, run:

```bash
npm run typecheck
npm run lint
npm test
npm run test:coverage
npm run build
```

For database-affecting work, also run:

```bash
npm run db:migrate:dry
```

## Important Production Notes

- Never expose `SUPABASE_SERVICE_ROLE_KEY`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, or `FILE_ENCRYPTION_KEY` to browser code.
- Keep `ENABLE_DEMO_PAYMENTS=false` in production.
- Use PayPal live credentials only after merchant approval and webhook registration.
- Treat in-app receipts and statutory Form 10BE documents as different things.
- Keep private verification, campaign evidence, and tax documents in private storage buckets.
- Apply all Supabase migrations before deploying a new production build.

## License

MIT
