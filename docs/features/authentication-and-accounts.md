# Authentication and Accounts

Authentication is handled by Supabase Auth. DaanSetu wraps Supabase Auth with account-type validation, profile records, role-aware redirects, email verification checks, and account security controls.

## Main Users

- Supporters
- NGO users
- Corporate users
- Admins

## Routes

- `/sign-in`
- `/sign-up`
- `/auth/signin`
- `/auth/signup`
- `/auth/login`
- `/auth/callback`
- `/forgot-password`
- `/reset-password`
- `/check-email`
- `/dashboard/security`

## Main Files

- `app/auth/actions.ts`
- `lib/auth/validation.ts`
- `lib/auth/redirects.ts`
- `lib/auth/profile.ts`
- `lib/auth/require-admin.ts`
- `lib/supabase/server.ts`
- `lib/supabase/middleware.ts`

## Account Creation

The sign-up flow accepts only self-service roles:

- `supporter`
- `ngo`
- `corporate`

Admin accounts are not self-service. An admin must be promoted after a real verified Supabase Auth account exists.

The sign-up form validates:

- Full name.
- Email format.
- Strong password.
- Password confirmation.
- Valid account type.

Emails are normalized before auth calls. Passwords are not silently trimmed because trimming can change a password the user intended to set.

## Sign In

Sign-in uses normalized email and password values. After sign-in, the user is sent to a safe return path or to a role-aware default destination.

Default destinations:

| Role | Destination |
| --- | --- |
| Supporter | `/dashboard` |
| NGO | `/ngo/profile` |
| Corporate | `/corporate/profile` |
| Admin | `/admin/analytics` |

The redirect helper blocks open redirects. External URLs, protocol-relative URLs, and suspicious slash patterns fall back to an internal route.

## Email Verification

Several sensitive pages require a verified email address. If the user is not verified, they are sent to `/check-email`.

Examples of verified-only flows:

- Community post creation.
- Corporate settlement.
- NGO tax-document handling.
- Payment-adjacent actions.

## Password Reset

The password reset flow has two parts:

1. `/forgot-password` asks Supabase to send a reset email.
2. `/reset-password` accepts the new password after the user follows the email link.

## Session Security

`/dashboard/security` exposes account security controls. The app supports global session revocation through `revokeAllSessionsAction`, which signs the user out globally.

## Middleware

`proxy.ts` calls `updateSession` from `lib/supabase/middleware.ts`. That keeps the Supabase session fresh and applies security headers.

Security headers include:

- `X-Frame-Options`
- `X-Content-Type-Options`
- `Referrer-Policy`
- `Strict-Transport-Security`
- `Content-Security-Policy`
- `Permissions-Policy`

## Admin Bootstrap

The `admin:bootstrap` script promotes an existing verified Supabase Auth user to the `admin` role in the `users` table and revokes existing sessions.

Required variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAIL`

Command:

```bash
npm run admin:bootstrap
```

