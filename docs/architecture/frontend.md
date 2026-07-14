# Frontend Architecture

The frontend uses Next.js App Router, React, TypeScript, and Tailwind CSS.

## Routing

Routes live under `app/`. The route folders are organized by product area:

- `app/dashboard` for supporter pages.
- `app/ngo` for NGO pages.
- `app/corporate` for corporate CSR pages.
- `app/volunteer` for volunteer pages.
- `app/admin` for admin pages.
- `app/community` for community pages.
- `app/api` for route handlers.
- `app/auth` plus top-level auth pages for authentication.

## Server Components First

Many pages are server components. This keeps data access near the route and avoids moving sensitive logic into the browser.

Use client components when the page needs:

- Local interaction.
- Browser APIs.
- Form composition that cannot be handled directly by server actions.
- Charts or interactive widgets.

## Server Actions

Server actions live close to the routes that use them. Examples:

- `app/auth/actions.ts`
- `app/community/actions.ts`
- `app/campaigns/actions.ts`
- `app/corporate/actions.ts`
- `app/ngo/profile/actions.ts`
- `app/admin/*/actions.ts`

Server actions should validate input, check session state, check ownership, and call database RPCs for critical state transitions.

## Shared Components

`components/` contains shared UI:

- Header.
- Donation modal.
- Campaign progress.
- NGO list and map.
- Auth forms.
- Landing page sections.
- NGO profile controls.
- Loading UI.

## Styling

Styling uses Tailwind CSS. Global styles live in `app/globals.css`.

## Charts

Charts use Recharts in pages such as:

- `app/analytics/PublicImpactCharts.tsx`
- `app/dashboard/impact/ImpactCharts.tsx`
- `app/admin/analytics/AnalyticsCharts.tsx`
- `app/ngo/dashboard/analytics/components/DonationsChart.tsx`

