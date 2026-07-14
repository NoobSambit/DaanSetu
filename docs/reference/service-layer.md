# Service Layer Reference

Service and domain files live under `lib/`.

## Auth

- `lib/auth/validation.ts` - auth input validation.
- `lib/auth/redirects.ts` - safe redirect and role default logic.
- `lib/auth/profile.ts` - user profile helpers.
- `lib/auth/require-admin.ts` - admin guard.

## Supabase

- `lib/supabase/server.ts` - cookie-aware server client.
- `lib/supabase/admin.ts` - server-only service-role client.
- `lib/supabase/client.ts` - browser client.
- `lib/supabase/middleware.ts` - session refresh.

## Domain

- `lib/domain/payment-money.ts` - money helpers.
- `lib/domain/financial-year.ts` - financial-year helpers.
- `lib/domain/csr.ts` - CSR domain helpers.
- `lib/domain/recommendations.ts` - recommendation helpers.
- `lib/domain/volunteer-matching.ts` - volunteer matching helpers.
- `lib/domain/campaigns.ts` - campaign domain helpers.

## Services

- `lib/services/analytics.ts`
- `lib/services/badges.ts`
- `lib/services/bookmarks.ts`
- `lib/services/campaigns.ts`
- `lib/services/corporate.ts`
- `lib/services/corporate-campaigns.ts`
- `lib/services/corporate-employees.ts`
- `lib/services/donations.ts`
- `lib/services/follows.ts`
- `lib/services/gemini.ts`
- `lib/services/leaderboard.ts`
- `lib/services/notifications.ts`
- `lib/services/partnerships.ts`
- `lib/services/posts.ts`
- `lib/services/user-profiles.ts`
- `lib/services/volunteers.ts`

## Security and Storage

- `lib/security/action-rate-limit.ts`
- `lib/security/encryption.ts`
- `lib/security/origin.ts`
- `lib/middleware/rate-limit.ts`
- `lib/storage/file-validation.ts`

