# Authentication

DaanSetu uses Supabase Auth and the Supabase free tier. Public authentication
pages use stable, password-manager-friendly URLs:

- `/sign-in`
- `/sign-up`
- `/forgot-password`
- `/reset-password`
- `/check-email`

The `/auth` namespace is reserved for protocol and compatibility routes:

- `/auth/callback` exchanges Supabase email codes for cookie-backed sessions.
- `/auth/login`, `/auth/signin`, and `/auth/signup` redirect old links to the
  canonical pages.

## Architecture

1. Forms submit to server actions in `app/auth/actions.ts`.
2. Server actions validate and normalize all input.
3. Supabase Auth creates or verifies the identity.
4. `public.handle_new_user()` atomically creates the matching `public.users`
   profile.
5. Supabase SSR stores the session in secure cookies.
6. Redirects are restricted to same-origin paths.
7. Server components and API routes authorize with `auth.getUser()`.

## Account Types

Self-service signup supports:

- `user`
- `ngo`
- `corporate`

The database trigger ignores every other requested value. In particular,
clients cannot create or promote themselves to `admin`. Direct insert, delete,
and update privileges on `public.users` are revoked from browser roles.

## Email Confirmation

Signup passes this redirect URL to Supabase:

```text
{NEXT_PUBLIC_APP_URL}/auth/callback?next={onboarding-path}
```

Add the local and production callback URLs to the Supabase Auth redirect URL
allowlist. Keep email confirmation enabled in production.

## Password Recovery

`/forgot-password` always displays the same result whether an address exists or
not, preventing account enumeration. Recovery links return through
`/auth/callback` and establish the temporary session required by
`/reset-password`.

## Database Setup

For a new project, run:

1. `supabase/schema.sql`
2. Every migration in `supabase/migrations/` in numeric order through
   `014_auth_pipeline.sql`

Migration `014` installs secure profile provisioning, repairs pre-existing auth
identities without profiles, and blocks direct role mutation.

## Environment

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Service-role credentials are never required by the browser or normal
authentication actions.

## Security Checklist

- Keep email confirmation enabled.
- Configure the exact production callback URL in Supabase.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to client code.
- Use `auth.getUser()` for server-side authorization.
- Keep `admin` assignment as a trusted database or administrative operation.
- Consider Supabase-supported Cloudflare Turnstile for free bot protection
  before a public launch.
