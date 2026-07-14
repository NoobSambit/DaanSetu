# Security Architecture

Security is built from several layers: Supabase Auth, RLS, server-side validation, private storage, encryption, origin checks, rate limits, CSP, and audit logs.

## Auth

Supabase Auth owns identity and sessions. The app adds role-aware routing, profile records, and verification gates.

## Authorization

Authorization happens in:

- Route handlers.
- Server actions.
- RLS policies.
- Database RPCs.

Important checks:

- Is the user signed in?
- Is email verified?
- Does the user own this record?
- Is the user an admin?
- Is the target record public?
- Is the state transition allowed?

## Service Role

`SUPABASE_SERVICE_ROLE_KEY` is only used through server-only code. Never expose it to the browser.

## Storage Security

Public assets can use public buckets. Sensitive files use private buckets and authenticated download routes.

Private file categories:

- NGO verification documents.
- Campaign evidence.
- Tax certificates.

## Encryption

Sensitive bytes use AES-256-GCM helpers in `lib/security/encryption.ts`. `FILE_ENCRYPTION_KEY` must be a base64-encoded 32-byte key.

## Payment Security

Payment routes validate:

- Session.
- Provider response.
- Amount.
- Currency.
- Origin where needed.
- Rate limits.
- Webhook identity.
- Idempotency.

## CSP and Headers

`proxy.ts` sets security headers and Content Security Policy. It allows Supabase, Gemini, and Google font origins needed by the app.

## Audit Logs

Important admin and financial actions should write audit logs. This protects operational accountability and debugging.

