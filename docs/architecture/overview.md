# Architecture Overview

DaanSetu is built on a modern, scalable architecture leveraging Next.js 14, Supabase, and serverless technologies.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  (Next.js 14 App Router + React 18 + Tailwind CSS)         │
│                                                             │
│  • Server-Side Rendering (SSR)                             │
│  • Client Components for Interactivity                     │
│  • Responsive UI with Tailwind                             │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer (Next.js)                     │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐       │
│  │ AI Routes   │  │   Payment   │  │    Social    │       │
│  │ /api/ai/*   │  │ /api/payment│  │  /api/posts  │       │
│  └─────────────┘  └─────────────┘  └──────────────┘       │
│                                                             │
│  • Rate Limiting Middleware                                │
│  • Authentication Checks                                   │
│  • Error Handling                                          │
└─────────────┬──────────────────────┬────────────────────────┘
              │                      │
              ▼                      ▼
┌──────────────────────┐  ┌──────────────────────────────────┐
│   Services Layer     │  │      External Services          │
│                      │  │                                  │
│  • donations.ts      │  │  • Google Gemini AI             │
│  • campaigns.ts      │  │  • Razorpay Payments            │
│  • gemini.ts         │  │                                  │
│  • posts.ts          │  │                                  │
│  • badges.ts         │  │                                  │
│  • volunteers.ts     │  │                                  │
└──────────┬───────────┘  └──────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer (Supabase)                     │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────┐ │
│  │   PostgreSQL    │  │  Auth (JWT)     │  │  Storage   │ │
│  │   Database      │  │                 │  │  (Images)  │ │
│  │                 │  │  • Row Level    │  │            │ │
│  │  • RLS Policies │  │    Security     │  │  • Public  │ │
│  │  • Triggers     │  │  • OAuth        │  │    Buckets │ │
│  │  • Functions    │  │                 │  │            │ │
│  └─────────────────┘  └─────────────────┘  └────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Architecture Principles

### 1. Separation of Concerns

The codebase is organized into distinct layers:

- **Presentation Layer**: React components and pages (`app/`, `components/`)
- **API Layer**: Next.js API routes (`app/api/`)
- **Business Logic**: Service functions (`lib/services/`)
- **Data Access**: Supabase client wrappers (`lib/supabase/`)

### 2. Server-First Approach

- **Server Components**: Default for better performance and SEO
- **Client Components**: Only when interactivity is needed (`'use client'`)
- **API Routes**: Server-side only logic (payments, AI, sensitive operations)

### 3. Type Safety

- **TypeScript**: End-to-end type safety
- **Database Types**: Auto-generated from Supabase schema
- **Strict Mode**: Enabled for catching errors early

### 4. Security by Default

- **Row Level Security (RLS)**: All database tables protected
- **Server-Side Secrets**: API keys never exposed to client
- **Rate Limiting**: All API endpoints protected
- **Input Validation**: Server-side validation on all inputs

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.1.0 | React framework with App Router |
| **React** | 18.3.1 | UI library |
| **TypeScript** | 5.3.3 | Type safety |
| **Tailwind CSS** | 3.4.0 | Utility-first styling |
| **Leaflet** | 1.9.4 | Interactive maps |
| **Recharts** | 3.4.1 | Data visualization |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Supabase** | 2.39.0 | PostgreSQL database, Auth, Storage |
| **Supabase SSR** | 0.5.2 | Server-side auth |
| **Google Gemini AI** | 0.24.1 | AI recommendations and chat |
| **Razorpay** | - | Payment processing |

### Infrastructure

- **Hosting**: Vercel (recommended)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage (S3-compatible)
- **CDN**: Vercel Edge Network

## Data Flow

### Example: Making a Donation

```
1. User clicks "Donate" button
   ↓
2. Client Component captures form data
   ↓
3. POST request to /api/payment/create-order
   ↓
4. API Route:
   - Validates input
   - Creates Razorpay order
   - Returns order details
   ↓
5. Client opens Razorpay payment modal
   ↓
6. User completes payment
   ↓
7. POST to /api/payment/verify
   ↓
8. API Route:
   - Verifies payment signature
   - Calls donations.createDonation() service
   ↓
9. Service Layer:
   - Inserts donation record
   - Updates campaign amount (atomic)
   - Logs activity
   ↓
10. Supabase:
    - Executes with RLS policies
    - Triggers badge calculation
    - Updates leaderboard
    ↓
11. Success response to client
    ↓
12. UI updates with success message
```

## Key Design Patterns

### 1. Service Layer Pattern

Business logic is centralized in service modules:

```typescript
// lib/services/donations.ts
export async function createDonation(params: CreateDonationParams) {
  // Validation
  // Payment processing
  // Database operations
  // Side effects (badges, leaderboard)
}
```

Benefits:
- Reusable across API routes and server components
- Testable in isolation
- Consistent error handling

### 2. Repository Pattern (Implicit)

Supabase client provides data access abstraction:

```typescript
const { data, error } = await supabase
  .from('campaigns')
  .select('*')
  .eq('status', 'active')
```

### 3. Middleware Pattern

Rate limiting and auth checks via middleware:

```typescript
export const withRateLimit = (handler, config) => {
  return async (request) => {
    // Check rate limit
    if (!allowed) return 429 error
    return handler(request)
  }
}
```

### 4. Cache-Aside Pattern

AI responses cached to reduce costs:

```typescript
// Check cache
const cached = getCachedResponse(key)
if (cached) return cached

// Generate response
const response = await ai.generate(prompt)

// Store in cache
setCachedResponse(key, response)
```

## Scalability Considerations

### Horizontal Scaling

- **Stateless API**: No server-side sessions (JWT auth)
- **Database Connection Pooling**: Supabase handles pooling
- **Edge Functions**: Can migrate to Supabase Edge Functions if needed

### Performance Optimizations

1. **Database Indexes**: On frequently queried columns
2. **Atomic Operations**: Using PostgreSQL functions for race-free updates
3. **Pagination**: All list endpoints support offset/limit
4. **Caching**: AI responses, static assets
5. **SSR**: Server-side rendering for better initial load

### Cost Optimization

1. **AI Caching**: Reduce Gemini API calls
2. **Image Optimization**: Next.js Image component
3. **Lazy Loading**: React.lazy for code splitting
4. **Supabase Free Tier**: Sufficient for early stages

## Security Architecture

### Defense in Depth

Multiple layers of security:

1. **Client-Side**: Input validation (UX only, not security)
2. **API Layer**: Rate limiting, auth checks
3. **Service Layer**: Business rule validation
4. **Database Layer**: RLS policies, constraints

### Authentication Flow

```
User Sign Up/Login
    ↓
Supabase Auth
    ↓
JWT Token Generated
    ↓
Token stored in httpOnly cookie (SSR)
    ↓
Subsequent requests include token
    ↓
Supabase verifies token
    ↓
RLS policies enforce data access
```

## Monitoring and Observability

### Logging

- **Application Logs**: Console logs (upgrade to structured logging in production)
- **Database Logs**: Supabase dashboard
- **Error Tracking**: Browser console (consider Sentry for production)

### Metrics

Monitor via Supabase dashboard:
- API request rate
- Database query performance
- Storage usage
- Auth events

## Next Steps

- [Frontend Architecture](./frontend.md) - React components and pages
- [Backend Architecture](./backend.md) - API routes and services
- [Database Design](./database.md) - Schema and relationships

## Further Reading

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Supabase Architecture](https://supabase.com/docs/guides/getting-started/architecture)
- [React Server Components](https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023#react-server-components)
