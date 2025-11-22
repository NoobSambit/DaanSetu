# Backend Architecture

DaanSetu's backend leverages Next.js API Routes for serverless functions and Supabase for database operations, creating a scalable and secure backend system.

## Architecture Overview

```
API Routes (app/api/)
       ↓
Middleware (Rate Limiting, Auth)
       ↓
Services Layer (lib/services/)
       ↓
Supabase Client (lib/supabase/)
       ↓
PostgreSQL Database + Storage
```

## API Routes Structure

```
app/api/
├── ai/                          # AI-powered features
│   ├── recommend-ngos/
│   │   └── route.ts            # GET /api/ai/recommend-ngos
│   ├── recommend-campaigns/
│   │   └── route.ts            # POST /api/ai/recommend-campaigns
│   ├── chat/
│   │   └── route.ts            # POST /api/ai/chat
│   └── analyze-content/
│       └── route.ts            # POST /api/ai/analyze-content
├── payment/                     # Payment processing
│   ├── create-order/
│   │   └── route.ts            # POST /api/payment/create-order
│   └── verify/
│       └── route.ts            # POST /api/payment/verify
├── posts/                       # Social features
│   ├── create/
│   │   └── route.ts            # POST /api/posts/create
│   ├── like/
│   │   └── route.ts            # POST /api/posts/like
│   ├── comment/
│   │   └── route.ts            # POST /api/posts/comment
│   └── [postId]/
│       └── comments/
│           └── route.ts        # GET /api/posts/:id/comments
├── upload/                      # File uploads
│   └── image/
│       └── route.ts            # POST /api/upload/image
├── bookmarks/                   # Bookmark features
│   ├── toggle/
│   │   └── route.ts            # POST /api/bookmarks/toggle
│   └── check/
│       └── route.ts            # GET /api/bookmarks/check
├── follows/                     # Follow system
│   ├── toggle/
│   │   └── route.ts            # POST /api/follows/toggle
│   └── check/
│       └── route.ts            # GET /api/follows/check
├── notifications/               # Notifications
│   ├── mark-read/
│   │   └── route.ts            # POST /api/notifications/mark-read
│   ├── mark-all-read/
│   │   └── route.ts            # POST /api/notifications/mark-all-read
│   └── delete/
│       └── route.ts            # DELETE /api/notifications/delete
└── badges/
    └── [userId]/
        └── route.ts            # GET /api/badges/:userId
```

## API Route Pattern

### Basic Route Handler

```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Business logic
    const { data, error } = await supabase
      .from('table')
      .select('*')

    if (error) {
      throw error
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Route with Rate Limiting

```typescript
// app/api/ai/recommend-ngos/route.ts
import { withRateLimit, RATE_LIMITS } from '@/lib/middleware/rate-limit'
import { generateNGORecommendations } from '@/lib/services/gemini'

async function handler(request: NextRequest) {
  const supabase = createServerClient()

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user context
  const { donationCauses, browsedCategories } = await getUserContext(user.id)

  // Get NGO list
  const { data: ngos } = await supabase
    .from('ngos')
    .select('id, name, category, description')

  // Generate AI recommendations
  const recommendations = await generateNGORecommendations({
    donationCauses,
    browsedCategories,
    volunteerSkills: [],
    ngoList: ngos || []
  })

  return NextResponse.json({ recommendations })
}

// Apply rate limiting (10 requests per minute)
export const GET = withRateLimit(handler, RATE_LIMITS.AI)
```

### POST Route with Validation

```typescript
// app/api/posts/create/route.ts
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate body
    const body = await request.json()
    const { content, image_url, hashtags } = body

    // Validation
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { error: 'Content too long (max 5000 characters)' },
        { status: 400 }
      )
    }

    // Create post using service
    const post = await createPost({
      userId: user.id,
      content,
      imageUrl: image_url,
      hashtags: hashtags || []
    }, supabase)

    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    console.error('Failed to create post:', error)
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}
```

## Services Layer

The services layer contains reusable business logic that can be called from API routes or server components.

### Service Structure

```
lib/services/
├── donations.ts            # Donation processing
├── campaigns.ts            # Campaign management
├── posts.ts                # Social posts
├── gemini.ts               # AI integration
├── badges.ts               # Gamification
├── volunteers.ts           # Volunteer management
├── corporate.ts            # Corporate CSR
├── analytics.ts            # Analytics and reporting
├── leaderboard.ts          # Leaderboards
├── notifications.ts        # Notification system
├── bookmarks.ts            # Bookmark management
├── follows.ts              # Follow system
├── activity-logs.ts        # Activity tracking
└── types.ts                # Shared types
```

### Service Pattern

```typescript
// lib/services/donations.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import { getBrowserClient } from '@/lib/supabase'

export interface CreateDonationParams {
  ngoId: string
  amount: number
  cause: DonationCause
  isAnonymous: boolean
  campaignId?: string
}

export async function createDonation(
  params: CreateDonationParams,
  supabaseClient?: SupabaseClient
) {
  const supabase = supabaseClient || getBrowserClient()

  // Validation
  if (params.amount <= 0) {
    throw new Error('Amount must be greater than 0')
  }

  if (params.amount > 10000000) {
    throw new Error('Amount cannot exceed ₹1,00,00,000')
  }

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('You must be logged in to donate')
  }

  // Create donation record
  const { data, error } = await supabase
    .from('donations')
    .insert({
      user_id: user.id,
      ngo_id: params.ngoId,
      campaign_id: params.campaignId || null,
      amount: params.amount,
      cause: params.cause,
      is_anonymous: params.isAnonymous,
      payment_status: 'completed'
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  // Update campaign amount atomically if applicable
  if (params.campaignId) {
    await supabase.rpc('increment_campaign_amount', {
      campaign_id: params.campaignId,
      amount_to_add: params.amount
    })
  }

  return data
}

export async function getUserDonations(supabaseClient?: SupabaseClient) {
  const supabase = supabaseClient || getBrowserClient()

  const { data, error } = await supabase
    .from('donations')
    .select(`
      id,
      amount,
      cause,
      is_anonymous,
      created_at,
      ngo:ngos(id, name, category)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data
}
```

**Benefits**:
- Reusable across API routes and server components
- Testable in isolation
- Consistent error handling
- Type-safe with TypeScript

### Atomic Operations

For operations that must be race-condition free, use PostgreSQL functions:

```typescript
// Update campaign amount atomically
await supabase.rpc('increment_campaign_amount', {
  campaign_id: campaignId,
  amount_to_add: donationAmount
})
```

Database function:
```sql
CREATE OR REPLACE FUNCTION increment_campaign_amount(
  campaign_id UUID,
  amount_to_add DECIMAL
)
RETURNS void AS $$
BEGIN
  UPDATE campaigns
  SET current_amount = current_amount + amount_to_add,
      updated_at = NOW()
  WHERE id = campaign_id;
END;
$$ LANGUAGE plpgsql;
```

## Middleware

### Rate Limiting Middleware

```typescript
// lib/middleware/rate-limit.ts

interface RateLimitConfig {
  windowMs: number       // Time window in milliseconds
  maxRequests: number    // Max requests per window
}

// Token bucket algorithm
export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  userId?: string
): { allowed: boolean; remaining: number; resetAt: number } {
  const clientId = getClientId(request, userId)
  const now = Date.now()

  // Get or create bucket
  let bucket = rateLimitStore.get(clientId)
  if (!bucket) {
    bucket = {
      tokens: config.maxRequests,
      lastRefill: now
    }
    rateLimitStore.set(clientId, bucket)
  }

  // Refill tokens based on elapsed time
  const timeSinceLastRefill = now - bucket.lastRefill
  const refillAmount = Math.floor(
    (timeSinceLastRefill / config.windowMs) * config.maxRequests
  )

  if (refillAmount > 0) {
    bucket.tokens = Math.min(config.maxRequests, bucket.tokens + refillAmount)
    bucket.lastRefill = now
  }

  // Check if request is allowed
  const allowed = bucket.tokens > 0
  if (allowed) {
    bucket.tokens -= 1
  }

  return {
    allowed,
    remaining: Math.max(0, bucket.tokens),
    resetAt: bucket.lastRefill + config.windowMs
  }
}

// Wrapper for easy use
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config: RateLimitConfig
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const { allowed, remaining, resetAt } = checkRateLimit(request, config)

    if (!allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          resetAt: new Date(resetAt).toISOString()
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': resetAt.toString(),
            'Retry-After': Math.ceil((resetAt - Date.now()) / 1000).toString()
          }
        }
      )
    }

    // Call handler
    const response = await handler(request)

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
    response.headers.set('X-RateLimit-Reset', resetAt.toString())

    return response
  }
}
```

## Error Handling

### Consistent Error Responses

```typescript
// Success response
return NextResponse.json({
  data: result,
  success: true
}, { status: 200 })

// Client error (4xx)
return NextResponse.json({
  error: 'Invalid input',
  message: 'Amount must be a positive number',
  success: false
}, { status: 400 })

// Server error (5xx)
return NextResponse.json({
  error: 'Internal server error',
  message: 'Failed to process request',
  success: false
}, { status: 500 })
```

### Error Types

| Status | Type | Usage |
|--------|------|-------|
| 400 | Bad Request | Invalid input, validation errors |
| 401 | Unauthorized | Not authenticated |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server errors |

## Authentication

### Getting Authenticated User

```typescript
const supabase = createServerClient()

const { data: { user }, error } = await supabase.auth.getUser()

if (error || !user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// user.id, user.email available
```

### Checking User Role

```typescript
const { data: profile } = await supabase
  .from('users')
  .select('role')
  .eq('id', user.id)
  .single()

if (profile?.role !== 'ngo') {
  return NextResponse.json(
    { error: 'Forbidden: NGO role required' },
    { status: 403 }
  )
}
```

## Payment Integration

### Create Razorpay Order

```typescript
// app/api/payment/create-order/route.ts
import Razorpay from 'razorpay'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!
})

export async function POST(request: NextRequest) {
  const { amount } = await request.json()

  const order = await razorpay.orders.create({
    amount: amount * 100, // Convert to paise
    currency: 'INR',
    receipt: `receipt_${Date.now()}`
  })

  return NextResponse.json({ orderId: order.id })
}
```

### Verify Payment

```typescript
// app/api/payment/verify/route.ts
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    await request.json()

  // Verify signature
  const sign = razorpay_order_id + '|' + razorpay_payment_id
  const expectedSign = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(sign)
    .digest('hex')

  if (razorpay_signature !== expectedSign) {
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  // Payment verified - create donation
  // ...

  return NextResponse.json({ success: true })
}
```

## AI Integration

See [AI Features](../features/ai-features.md) for detailed AI integration patterns.

## Next Steps

- [Database Architecture](./database.md) - Schema and relationships
- [API Reference](../api/overview.md) - Complete API documentation
- [Security Guide](../security/overview.md) - Security best practices
