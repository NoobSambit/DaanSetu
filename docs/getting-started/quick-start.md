# Quick Start

Use this when you want to run DaanSetu locally.

## 1. Install

```bash
npm install
```

## 2. Create Environment File

```bash
cp .env.example .env
```

Fill in the values explained in [environment variables](../operations/environment-variables.md).

## 3. Run the App

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## 4. Run Checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## 5. Optional Demo Data

Only use this against a safe development Supabase project:

```bash
npm run db:seed:remote
npm run db:seed:assets
npm run db:seed:verify
```
