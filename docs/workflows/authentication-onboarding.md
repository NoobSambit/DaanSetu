# Authentication and Onboarding Workflow

This workflow covers how a user enters the platform and reaches the right first workspace.

## Sign-Up

1. User opens `/sign-up` or `/auth/signup`.
2. User chooses an account type: supporter, NGO, or corporate.
3. The server validates name, email, password, confirmation, and account type.
4. Email is normalized.
5. Supabase Auth creates the account.
6. A matching public `users` profile is created or updated.
7. User is sent to `/check-email` when email verification is required.

## Sign-In

1. User opens a sign-in page.
2. User submits email and password.
3. Email is normalized.
4. Supabase Auth validates credentials.
5. The redirect helper checks any return path.
6. If the return path is unsafe, it is ignored.
7. User is sent to the safe return path or role default.

## Role Defaults

| Role | Default page |
| --- | --- |
| Supporter | `/dashboard` |
| NGO | `/ngo/profile` |
| Corporate | `/corporate/profile` |
| Admin | `/admin/analytics` |

## Email Verification Gates

Sensitive workflows check `email_confirmed_at`.

If the user is not verified:

1. The server refuses the action or redirects.
2. The user lands on `/check-email`.
3. The user must verify email before continuing.

## Password Reset

1. User opens `/forgot-password`.
2. User submits email.
3. Supabase sends the reset email.
4. User follows the email link.
5. User opens `/reset-password`.
6. User submits a strong new password.

## Global Sign-Out

1. User opens `/dashboard/security`.
2. User chooses to revoke all sessions.
3. `revokeAllSessionsAction` calls Supabase global sign-out.
4. Existing sessions are revoked.

