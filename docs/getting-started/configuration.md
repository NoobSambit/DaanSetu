# Configuration Guide

This guide covers all configuration options available in DaanSetu.

## Environment Variables

DaanSetu uses environment variables for configuration. All variables are defined in the `.env` file at the project root.

### Required Variables

#### Supabase Configuration

```bash
# Your Supabase project URL
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co

# Supabase anonymous (public) key - safe to expose to browser
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Usage**: Database operations, authentication, storage
**Location**: Project Settings → API in Supabase dashboard

#### AI Configuration

```bash
# Google Gemini API key - MUST be server-side only (no NEXT_PUBLIC_ prefix)
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**⚠️ Security Warning**: Never use `NEXT_PUBLIC_GEMINI_API_KEY` - this would expose your API key to all website visitors!

**Usage**: AI recommendations, content analysis, chat assistant
**Get Key**: [Google AI Studio](https://makersuite.google.com/app/apikey)

#### Payment Gateway Configuration

```bash
# Razorpay credentials for test mode
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx

# Public key for client-side Razorpay integration
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
```

**Usage**: Donation processing, order creation, payment verification
**Test Mode**: Use `rzp_test_` prefix for development
**Live Mode**: Use `rzp_live_` prefix for production

#### Application Configuration

```bash
# Environment (development, production, test)
NODE_ENV=development

# Application base URL (used for redirects, webhooks, etc.)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Optional Variables

#### Debugging

```bash
# Enable verbose logging
DEBUG=true

# Log level (error, warn, info, debug)
LOG_LEVEL=info
```

#### Performance

```bash
# Enable AI response caching (default: true)
ENABLE_AI_CACHE=true

# AI cache TTL in milliseconds (default: 3600000 = 1 hour)
AI_CACHE_TTL=3600000
```

## Rate Limiting Configuration

Rate limits are configured in `lib/middleware/rate-limit.ts`:

```typescript
export const RATE_LIMITS = {
  // AI endpoints (expensive operations)
  AI: {
    windowMs: 60 * 1000,    // 1 minute window
    maxRequests: 10          // 10 requests per minute
  },

  // Upload endpoints
  UPLOAD: {
    windowMs: 60 * 1000,
    maxRequests: 20
  },

  // Payment endpoints
  PAYMENT: {
    windowMs: 60 * 1000,
    maxRequests: 30
  },

  // General API endpoints
  DEFAULT: {
    windowMs: 60 * 1000,
    maxRequests: 100
  },

  // Public endpoints (no auth required)
  PUBLIC: {
    windowMs: 60 * 1000,
    maxRequests: 200
  },
}
```

### Adjusting Rate Limits

For production, you may want to adjust these based on your traffic:

```typescript
// More restrictive for production
AI: { windowMs: 60 * 1000, maxRequests: 5 },

// Or more permissive for enterprise users
DEFAULT: { windowMs: 60 * 1000, maxRequests: 500 },
```

## Supabase Storage Configuration

### Bucket Policies

All storage buckets should be configured as **public** with the following policies:

```sql
-- Allow public read access
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'campaigns');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'campaigns');
```

Apply this to each bucket: `campaigns`, `ngos`, `posts`, `profiles`, `corporate`

### File Size Limits

Configure in Supabase dashboard (Storage → Settings):

- **Max file size**: 5MB (recommended for images)
- **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`

## Database Configuration

### Connection Pooling

For production deployments, enable connection pooling in Supabase:

1. Go to **Database → Connection Pooling**
2. Enable **Transaction Mode** for better performance
3. Use the pooled connection string in production

### Row Level Security (RLS)

RLS is **required** on all tables. See [RLS Policies](../security/rls-policies.md) for complete policy definitions.

## AI Model Configuration

### Model Selection

DaanSetu uses `gemini-1.5-flash` for optimal balance of speed and quality:

```typescript
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash'
})
```

**Alternative models**:
- `gemini-1.5-pro` - Higher quality, slower, more expensive
- `gemini-1.0-pro` - Legacy model (not recommended)

### Response Caching

AI responses are cached for 1 hour to reduce costs:

```typescript
const CACHE_TTL = 1000 * 60 * 60 // 1 hour
```

Adjust in `lib/services/gemini.ts` based on your needs:
- **Higher TTL**: Lower costs, less fresh recommendations
- **Lower TTL**: Higher costs, more personalized responses

## Next.js Configuration

### Next.js Config (`next.config.ts`)

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Enable React Strict Mode for development
  reactStrictMode: true,
}

export default nextConfig
```

### TypeScript Configuration

See `tsconfig.json` for TypeScript compiler options. Key settings:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

## Tailwind Configuration

Custom theme configuration in `tailwind.config.ts`:

```typescript
export default {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Custom brand colors
      },
      animation: {
        // Custom animations
      },
    },
  },
}
```

## Development vs Production

### Development Settings

```bash
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
RAZORPAY_KEY_ID=rzp_test_xxxxx  # Test mode
```

### Production Settings

```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://daansetu.com
RAZORPAY_KEY_ID=rzp_live_xxxxx  # Live mode
```

**Important**:
- Always use test Razorpay keys in development
- Enable Razorpay live mode only after thorough testing
- Use environment-specific Supabase projects

## Security Best Practices

1. **Never commit `.env` files** - Add to `.gitignore`
2. **Use server-side only vars** for secrets (no `NEXT_PUBLIC_` prefix)
3. **Rotate API keys** regularly in production
4. **Use different keys** for dev/staging/production
5. **Enable RLS** on all Supabase tables
6. **Set up rate limiting** on all API routes

## Monitoring and Logging

### Supabase Logs

View real-time logs in Supabase dashboard:
- **Database**: Query performance, errors
- **Auth**: Login attempts, failures
- **Storage**: Upload activity

### Application Logs

Use `console.error` for errors, `console.warn` for warnings:

```typescript
try {
  // Operation
} catch (error) {
  console.error('Failed to process donation:', error)
  // Handle error
}
```

For production, consider integrating:
- **Sentry** - Error tracking
- **LogRocket** - Session replay
- **DataDog** - APM and monitoring

## Next Steps

- [Quick Start Guide](./quick-start.md)
- [Architecture Overview](../architecture/overview.md)
- [Security Best Practices](../security/best-practices.md)
