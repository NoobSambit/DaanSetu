# API Overview

DaanSetu provides a RESTful API built with Next.js API Routes for all backend operations.

## Base URL

```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

## Authentication

Most endpoints require authentication via Supabase Auth.

### Getting Auth Token

Users authenticate via Supabase Auth (handled automatically by the client SDK):

```typescript
// Client-side login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})

// Token is automatically included in subsequent requests
```

### Authentication Flow

1. User logs in via `/auth/login`
2. Supabase Auth sets httpOnly cookie with JWT
3. Subsequent API requests include cookie
4. Server validates token via `supabase.auth.getUser()`

## Rate Limiting

All API endpoints are rate-limited to prevent abuse.

### Rate Limit Tiers

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| AI endpoints | 10 requests | 1 minute |
| Upload | 20 requests | 1 minute |
| Payment | 30 requests | 1 minute |
| Default | 100 requests | 1 minute |
| Public | 200 requests | 1 minute |

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
Retry-After: 60
```

### 429 Too Many Requests

```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again later.",
  "resetAt": "2024-01-01T00:00:00.000Z"
}
```

## Response Format

### Success Response

```json
{
  "data": { ... },
  "success": true
}
```

### Error Response

```json
{
  "error": "Error type",
  "message": "Human-readable error message",
  "success": false
}
```

## Error Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 400 | Bad Request | Invalid input, validation failed |
| 401 | Unauthorized | Not authenticated |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

## API Endpoints

### AI Endpoints

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| GET | `/api/ai/recommend-ngos` | Get AI-powered NGO recommendations | 10/min |
| POST | `/api/ai/recommend-campaigns` | Get AI-powered campaign recommendations | 10/min |
| POST | `/api/ai/chat` | Chat with DaanSetu AI assistant | 10/min |
| POST | `/api/ai/analyze-content` | Analyze content for quality/fraud | 10/min |

### Payment Endpoints

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| POST | `/api/payment/create-order` | Create Razorpay order | 30/min |
| POST | `/api/payment/verify` | Verify payment signature | 30/min |

### Social Endpoints

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| POST | `/api/posts/create` | Create a new post | 100/min |
| POST | `/api/posts/like` | Like/unlike a post | 100/min |
| POST | `/api/posts/comment` | Comment on a post | 100/min |
| GET | `/api/posts/[postId]/comments` | Get post comments | 100/min |

### Upload Endpoints

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| POST | `/api/upload/image` | Upload image to Supabase Storage | 20/min |

### Bookmark Endpoints

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| POST | `/api/bookmarks/toggle` | Toggle bookmark | 100/min |
| GET | `/api/bookmarks/check` | Check if bookmarked | 100/min |

### Follow Endpoints

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| POST | `/api/follows/toggle` | Follow/unfollow NGO | 100/min |
| GET | `/api/follows/check` | Check follow status | 100/min |

### Notification Endpoints

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| POST | `/api/notifications/mark-read` | Mark notification as read | 100/min |
| POST | `/api/notifications/mark-all-read` | Mark all as read | 100/min |
| DELETE | `/api/notifications/delete` | Delete notification | 100/min |

### Badge Endpoints

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| GET | `/api/badges/[userId]` | Get user badges | 100/min |

## Example Requests

### Create a Post

```bash
curl -X POST http://localhost:3000/api/posts/create \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=..." \
  -d '{
    "content": "Excited to support education!",
    "image_url": "https://...",
    "hashtags": ["education", "impact"]
  }'
```

**Response**:
```json
{
  "post": {
    "id": "uuid",
    "user_id": "uuid",
    "content": "Excited to support education!",
    "likes_count": 0,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### Get AI Recommendations

```bash
curl http://localhost:3000/api/ai/recommend-ngos \
  -H "Cookie: auth-token=..."
```

**Response**:
```json
{
  "recommendations": [
    {
      "ngo_name": "Education for All",
      "reason": "Based on your interests in education and previous donations..."
    }
  ]
}
```

## Pagination

For endpoints returning lists, use `range()` for pagination:

```typescript
// Server-side (in page component)
const { data } = await supabase
  .from('campaigns')
  .select('*')
  .range(0, 9) // Get records 0-9 (10 total)
  .order('created_at', { ascending: false })
```

## Next Steps

- [Authentication](./authentication.md) - Auth flows and user management
- [AI Endpoints](./ai-endpoints.md) - AI-powered features
- [Payment API](./payment.md) - Payment processing
- [Social API](./social.md) - Social features

## Resources

- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
