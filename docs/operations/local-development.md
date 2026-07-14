# Local Development

## Install

```bash
npm install
```

## Run

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Build

```bash
npm run build
```

The build script uses:

```bash
next build --webpack
```

## Common Checks

```bash
npm run typecheck
npm run lint
npm test
```

## Formatting

```bash
npm run format
npm run format:check
```

`npm run format` also formats `supabase/seed.sql` and `supabase/verify-seed.sql`.

## Useful Development Notes

- The app needs Supabase environment values to run most real pages.
- Payment flows need PayPal sandbox values.
- AI features can work without Gemini if fallback behavior is preserved.
- Do not run seed commands against production.
