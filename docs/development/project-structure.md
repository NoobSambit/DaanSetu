# Project Structure

Comprehensive guide to DaanSetu's codebase organization.

## Root Directory

```
DaanSetu/
├── app/                    # Next.js 14 App Router
├── components/             # Reusable React components
├── lib/                    # Business logic and utilities
├── supabase/              # Database schema and migrations
├── public/                # Static assets
├── .env                   # Environment variables (git-ignored)
├── .env.example           # Environment template
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
├── tailwind.config.ts     # Tailwind CSS config
├── next.config.ts         # Next.js config
└── middleware.ts          # Next.js middleware

## App Directory (Next.js App Router)

```
app/
├── layout.tsx             # Root layout (wraps all pages)
├── page.tsx               # Homepage (/)
├── globals.css            # Global styles
│
├── (auth)/                # Auth route group
│   ├── login/
│   │   └── page.tsx       # /login
│   └── signup/
│       └── page.tsx       # /signup
│
├── api/                   # API routes
│   ├── ai/               # AI endpoints
│   ├── payment/          # Payment processing
│   ├── posts/            # Social features
│   ├── upload/           # File uploads
│   ├── bookmarks/        # Bookmark management
│   ├── follows/          # Follow system
│   ├── notifications/    # Notifications
│   └── badges/           # Gamification
│
├── campaigns/             # Campaign pages
│   ├── page.tsx          # /campaigns (list)
│   ├── create/           # /campaigns/create
│   ├── [id]/             # /campaigns/:id (dynamic)
│   └── components/       # Campaign-specific components
│
├── ngos/                  # NGO directory
│   ├── page.tsx          # /ngos (list)
│   └── [id]/             # /ngos/:id (dynamic)
│
├── dashboard/             # User dashboard
│   ├── page.tsx          # /dashboard
│   ├── impact/           # /dashboard/impact
│   ├── bookmarks/        # /dashboard/bookmarks
│   ├── activity/         # /dashboard/activity
│   └── components/       # Dashboard components
│
├── ngo/                   # NGO-specific pages
│   └── dashboard/        # NGO dashboard
│       ├── page.tsx
│       ├── volunteers/
│       └── analytics/
│
├── volunteer/             # Volunteer section
│   ├── profile/
│   └── opportunities/
│
├── corporate/             # Corporate CSR
│   └── dashboard/
│
├── community/             # Social feed
├── leaderboard/           # Gamification
├── notifications/         # Notifications page
├── profile/               # User profiles
│   └── [userId]/
├── map/                   # NGO map view
├── impact-stories/        # Impact stories
└── analytics/             # Platform analytics
```

## Components Directory

```
components/
├── ErrorBoundary.tsx      # Error handling component
├── Navbar.tsx             # Main navigation
├── Footer.tsx             # Footer
│
└── ui/                    # Reusable UI components
    ├── Button.tsx
    ├── Card.tsx
    ├── Modal.tsx
    ├── Input.tsx
    └── ... (add as needed)
```

## Lib Directory

```
lib/
├── supabase/              # Database client setup
│   ├── client.ts          # Browser client
│   ├── server.ts          # Server client
│   ├── middleware.ts      # Middleware client
│   └── index.ts           # Unified exports
│
├── services/              # Business logic layer
│   ├── donations.ts       # Donation management
│   ├── campaigns.ts       # Campaign CRUD
│   ├── gemini.ts          # AI integration
│   ├── posts.ts           # Social features
│   ├── badges.ts          # Gamification
│   ├── volunteers.ts      # Volunteer management
│   ├── corporate.ts       # Corporate CSR
│   ├── analytics.ts       # Analytics & reporting
│   ├── leaderboard.ts     # Leaderboards
│   ├── notifications.ts   # Notification system
│   ├── bookmarks.ts       # Bookmark management
│   ├── follows.ts         # Follow system
│   ├── activity-logs.ts   # Activity tracking
│   └── types.ts           # Shared types
│
├── middleware/            # Custom middleware
│   └── rate-limit.ts      # Rate limiting
│
└── types/                 # TypeScript types
    └── database.types.ts  # Database types
```

## Supabase Directory

```
supabase/
├── schema.sql             # Initial database schema
└── migrations/            # Database migrations (run in order)
    ├── 007_corporate_csr_module.sql
    ├── 008_social_community_layer.sql
    ├── 009_phase8_enhancements.sql
    ├── 010_critical_fixes.sql
    ├── 011_security_fixes.sql
    └── 012_performance_indexes.sql
```

## File Naming Conventions

### Components

```
PascalCase for components:
✅ DonateButton.tsx
✅ CampaignCard.tsx
✅ UserProfile.tsx
```

### Services

```
camelCase for service files:
✅ donations.ts
✅ campaigns.ts
✅ userProfiles.ts
```

### API Routes

```
kebab-case for folders, route.ts for file:
✅ api/recommend-ngos/route.ts
✅ api/create-order/route.ts
```

### Pages

```
Always page.tsx in App Router:
✅ campaigns/page.tsx
✅ dashboard/page.tsx
```

## Import Paths

Use `@/` alias for absolute imports:

```typescript
// ✅ Good - Absolute import
import { createDonation } from '@/lib/services/donations'
import { Button } from '@/components/ui/Button'

// ❌ Bad - Relative import (harder to maintain)
import { createDonation } from '../../../lib/services/donations'
```

## Code Organization Patterns

### 1. Separation of Concerns

```
Presentation (app/) → API (app/api/) → Services (lib/services/) → Database
```

### 2. Feature-Based Organization

Group related files by feature:

```
campaigns/
├── page.tsx              # List page
├── create/               # Create page
├── [id]/                 # Detail page
└── components/           # Campaign-specific components
    ├── CampaignCard.tsx
    └── DonateButton.tsx
```

### 3. Shared Components

Reusable components in `components/`:

```
components/ui/Button.tsx → Used everywhere
```

## Directory Guidelines

### When to Create a New Directory

**DO create** when:
- Feature has 3+ related files
- Components are feature-specific
- Clear organizational benefit

**DON'T create** for:
- Single files
- Unclear grouping

### Naming Directories

```
✅ kebab-case: volunteer-opportunities/
✅ PascalCase: AIRecommendations/ (for component folders)
❌ snake_case: volunteer_opportunities/
```

## Configuration Files

### package.json

Dependencies and scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

### tsconfig.json

TypeScript configuration:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### next.config.ts

Next.js configuration:

```typescript
const nextConfig = {
  images: {
    remotePatterns: [...]
  }
}
```

### tailwind.config.ts

Tailwind CSS configuration:

```typescript
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ]
}
```

## Next Steps

- [Coding Standards](./coding-standards.md) - Code style guide
- [Testing Guide](./testing.md) - Testing strategies
- [Frontend Architecture](../architecture/frontend.md) - React patterns

## Resources

- [Next.js Project Structure](https://nextjs.org/docs/getting-started/project-structure)
- [React File Structure](https://react.dev/learn/thinking-in-react#step-1-break-the-ui-into-a-component-hierarchy)
