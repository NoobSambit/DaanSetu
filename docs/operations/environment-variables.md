# Environment Variables

Copy `.env.example` to `.env` and fill the values.

```bash
cp .env.example .env
```

## Supabase

| Variable                               | Purpose                                                  |
| -------------------------------------- | -------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase project URL used by browser and server clients. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe Supabase key.                               |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`        | Fallback browser-safe Supabase anon key.                 |
| `SUPABASE_SERVICE_ROLE_KEY`            | Server-only key for privileged backend work.             |
| `SUPABASE_PROJECT_ID`                  | Project ID used by type generation.                      |
| `SUPABASE_ACCESS_TOKEN`                | Supabase CLI token for linked project operations.        |

Never expose the service-role key to browser code.

## App

| Variable              | Purpose                                               |
| --------------------- | ----------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL` | Base URL used for redirects and provider return URLs. |
| `ADMIN_EMAIL`         | Verified user email promoted by `admin:bootstrap`.    |

## AI

| Variable         | Purpose                                                      |
| ---------------- | ------------------------------------------------------------ |
| `GEMINI_API_KEY` | Optional Gemini key for recommendations, chat, and analysis. |

If it is missing, AI features should degrade gracefully.

## Encryption

| Variable              | Purpose                                           |
| --------------------- | ------------------------------------------------- |
| `FILE_ENCRYPTION_KEY` | Base64-encoded 32-byte key for private documents. |

This is required for seeded private assets and sensitive document encryption.

## PayPal

| Variable                       | Purpose                                                      |
| ------------------------------ | ------------------------------------------------------------ |
| `PAYPAL_ENVIRONMENT`           | `sandbox` or `live`.                                         |
| `PAYPAL_CLIENT_ID`             | Server-side PayPal client ID.                                |
| `PAYPAL_CLIENT_SECRET`         | Server-only PayPal secret.                                   |
| `PAYPAL_WEBHOOK_ID`            | Webhook ID used for verification.                            |
| `PAYPAL_INR_PER_USD`           | Server-controlled INR conversion rate for PayPal settlement. |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | Browser-safe PayPal client ID.                               |

## PayPal Subscription Plans

| Variable                             | Purpose                              |
| ------------------------------------ | ------------------------------------ |
| `PAYPAL_PLAN_MONTHLY`                | PayPal monthly plan ID.              |
| `PAYPAL_PLAN_MONTHLY_AMOUNT_PAISE`   | Expected monthly INR paise amount.   |
| `PAYPAL_PLAN_QUARTERLY`              | PayPal quarterly plan ID.            |
| `PAYPAL_PLAN_QUARTERLY_AMOUNT_PAISE` | Expected quarterly INR paise amount. |
| `PAYPAL_PLAN_YEARLY`                 | PayPal yearly plan ID.               |
| `PAYPAL_PLAN_YEARLY_AMOUNT_PAISE`    | Expected yearly INR paise amount.    |

## Feature Flags

| Variable                 | Purpose                                              |
| ------------------------ | ---------------------------------------------------- |
| `ENABLE_PAYMENTS`        | Enables payment routes.                              |
| `ENABLE_SUBSCRIPTIONS`   | Enables subscription routes.                         |
| `PAYPAL_PAYOUTS_ENABLED` | Enables PayPal payout-related behavior when ready.   |
| `ENABLE_DEMO_PAYMENTS`   | Enables local demo payment route outside production. |

Production should use:

```dotenv
ENABLE_DEMO_PAYMENTS=false
```
