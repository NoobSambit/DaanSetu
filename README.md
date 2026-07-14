# DaanSetu

DaanSetu connects supporters, verified NGOs, volunteers, and corporate CSR teams through a single Supabase-backed Next.js platform. It includes NGO and campaign discovery, fundraising, PayPal giving, demo-safe payment showcases, volunteer workflows, community publishing, CSR matching, moderation, and impact reporting.

## Stack

- Next.js 16 and React 19
- Supabase Auth, PostgreSQL, Storage, and Realtime
- PayPal REST Orders, Subscriptions, Refunds, and Webhooks
- Optional Gemini candidate reranking with deterministic fallback
- TypeScript, Tailwind CSS, Zod, and Node's test runner

The application does not require Docker. Development and release validation use the hosted Supabase project selected by the environment.

## Prerequisites

- Node.js 20 or newer
- npm
- A hosted Supabase project
- PayPal developer credentials for sandbox or live payment processing
- An optional Gemini API key

## Setup

Install dependencies:

```bash
npm install
```

Copy `.env.example` to `.env` and provide the required values. Never commit `.env` or expose service-role, PayPal secret, or webhook credentials to browser code.

Core variables:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_PROJECT_ID=your-project-ref

NEXT_PUBLIC_APP_URL=http://localhost:3000

PAYPAL_ENVIRONMENT=sandbox
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_WEBHOOK_ID=your-paypal-webhook-id
PAYPAL_INR_PER_USD=83.00

ENABLE_PAYMENTS=true
ENABLE_SUBSCRIPTIONS=true
PAYPAL_PAYOUTS_ENABLED=false
ENABLE_DEMO_PAYMENTS=true

GEMINI_API_KEY=
FILE_ENCRYPTION_KEY=base64-encoded-32-byte-key
```

`PAYPAL_INR_PER_USD` is a server-controlled settlement rate. Campaign goals and public impact remain stored as integer INR paise; PayPal settlement currency and minor units are stored separately on payment records. Each configured PayPal subscription plan must also declare its exact INR paise amount through `PAYPAL_PLAN_<INTERVAL>_AMOUNT_PAISE`; the API rejects mismatched recurring gifts.

## Supabase

Migrations under `supabase/migrations/` are the active schema source and must be applied in numeric order. Existing projects should use the linked CLI workflow:

```bash
npm run db:migrate:dry
npm run db:push
npm run db:types
```

These commands target hosted Supabase and do not start local containers. `db:push` mutates the linked database, so review the dry run first.

Private verification and statutory documents must remain in private buckets. Access is granted through authenticated, ownership-aware server routes rather than public object URLs.

## Payment modes

### PayPal Sandbox

Use `PAYPAL_ENVIRONMENT=sandbox` with sandbox credentials for an end-to-end provider flow using non-production PayPal accounts. Orders are created on the server, captures are verified against PayPal, and signed webhook events are reconciled idempotently.

### Isolated demo payments

Set `ENABLE_DEMO_PAYMENTS=true` only in local or controlled non-production demos. The `/api/demo/payments` route:

- is unavailable when `NODE_ENV=production`;
- requires an authenticated and email-verified user;
- marks every record with `is_demo=true`;
- uses the same atomic donation-recording path as captured payments; and
- excludes demo donations from campaign totals and public impact aggregates.

This route is for presentation rehearsals where no external transaction should occur. It must never be used as a payment fallback.

### Production

Use PayPal live credentials, register the exact production webhook URL, disable demo payments, and enable only provider products approved for the merchant account. PayPal merchant availability and supported currencies vary by country; validate the final settlement model for the production account before launch.

## Development

```bash
npm run dev
```

Open `http://localhost:3000`.

## Verification

Run the complete local gate:

```bash
npm run format
npm run format:check
npm run typecheck
npm run lint
npm test
npm run test:coverage
npm run build
npm audit --omit=dev
```

Database checks against a linked hosted project:

```bash
npm run db:lint
npm run db:migrate:dry
```

## Security model

- Supabase Auth owns identity and email verification.
- RLS protects user-owned and role-restricted records.
- Service-role access is confined to server-only modules.
- Mutations validate inputs, sessions, ownership, and same-origin requests.
- Payment events use unique provider identifiers and atomic PostgreSQL functions.
- Demo payments are structurally separated from real financial reporting.
- Gemini receives only selected candidate data and silently falls back to deterministic ranking.
- Official Form 10BE documents are uploaded and mapped; the application does not manufacture statutory certificates.
- Donor statutory identifiers and addresses are encrypted with AES-256-GCM using field-specific authenticated contexts before storage.

## Important routes

- `/ngos` and `/campaigns` — public discovery
- `/volunteer/opportunities` — skill-based opportunities
- `/community` — posts and impact stories
- `/dashboard/giving` — donations, subscriptions, receipts, and refunds
- `/ngo/dashboard` — NGO operations
- `/corporate/dashboard` — CSR programs and employee attribution
- `/admin/operations` — verification, moderation, refunds, payouts, settlements, and audit records

## Deployment checklist

1. Apply every pending Supabase migration and regenerate database types.
2. Configure Supabase Auth redirect URLs and private Storage policies.
3. Set production-only secrets in the deployment environment.
4. Set `PAYPAL_ENVIRONMENT=live` only after provider approval and webhook registration.
5. Set `ENABLE_DEMO_PAYMENTS=false` and verify that the demo route returns `404`.
6. Run the complete verification gate and linked migration dry run.
7. Verify payment capture, duplicate webhook delivery, refund, subscription, and reconciliation scenarios with approved provider accounts.

## License

MIT
