# Database and Seed Data

Supabase migrations and seed files live under `supabase/`.

## Schema Source

Migrations:

```text
supabase/migrations/
```

Generated TypeScript types:

```text
lib/types/database.types.ts
```

## Migration Commands

Dry run:

```bash
npm run db:migrate:dry
```

Push to linked project:

```bash
npm run db:push
```

Generate types:

```bash
npm run db:types
```

Lint linked database:

```bash
npm run db:lint
```

## Seed Commands

Remote SQL seed:

```bash
npm run db:seed:remote
```

Seed demo assets:

```bash
npm run db:seed:assets
```

Verify seed:

```bash
npm run db:seed:verify
```

## Seed Safety

The seed is for development and demos. It creates fictional users, NGOs, donations, volunteer records, community content, assets, and documents.

Do not run seed commands against production.

## Demo Accounts

Seeded accounts use the development-only password:

```text
DaanSetuDemo@2026
```

Representative emails:

| Role | Email |
| --- | --- |
| Supporter | `supporter001@demo.daansetu.local` |
| NGO owner | `ngo01@demo.daansetu.local` |
| Corporate owner | `corporate01@demo.daansetu.local` |
| Administrator | `admin1@demo.daansetu.local` |

