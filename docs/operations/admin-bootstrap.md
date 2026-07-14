# Admin Bootstrap

Admin accounts are not self-service. A real verified Supabase Auth user must be promoted.

## Required Environment

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_EMAIL=
```

`ADMIN_EMAIL` must belong to an existing verified Supabase Auth user.

## Command

```bash
npm run admin:bootstrap
```

## What It Does

The script:

1. Lists Supabase Auth users.
2. Finds the user matching `ADMIN_EMAIL`.
3. Confirms the email is verified.
4. Updates the matching row in `users` to `role = 'admin'`.
5. Revokes the user's existing sessions.

The user should sign in again after promotion.

