# Authentication API

DaanSetu uses Supabase Auth for user authentication and authorization.

## Authentication Flow

```
1. User visits /auth/signup or /auth/login
   ↓
2. Form submits to Supabase Auth
   ↓
3. Supabase creates/validates user
   ↓
4. JWT token stored in httpOnly cookie
   ↓
5. User redirected to dashboard
   ↓
6. Subsequent requests include auth cookie
   ↓
7. API routes validate via supabase.auth.getUser()
```

## Sign Up

### Endpoint
`POST /auth/signup` (page, not API route)

### Request Body
```typescript
{
  name: string       // User's full name
  email: string      // Valid email address
  password: string   // Min 6 characters
  role: 'user' | 'ngo' | 'admin'
}
```

### Example

```typescript
// Client-side code
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'securePassword123',
  options: {
    data: {
      name: 'John Doe',
      role: 'user'
    }
  }
})

if (error) {
  console.error('Signup error:', error.message)
} else {
  // User created, profile auto-created via trigger
  router.push('/dashboard')
}
```

### Success Response

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "authenticated"
  },
  "session": {
    "access_token": "jwt-token",
    "refresh_token": "refresh-token"
  }
}
```

### Auto-Created Profile

When a user signs up, a database trigger automatically creates their profile:

```sql
-- Trigger: handle_new_user()
INSERT INTO users (id, email, name, role)
VALUES (new_user.id, email, name, role);
```

## Sign In

### Endpoint
`POST /auth/login` (page, not API route)

### Request Body
```typescript
{
  email: string
  password: string
}
```

### Example

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'securePassword123'
})

if (error) {
  console.error('Login error:', error.message)
} else {
  router.push('/dashboard')
}
```

## Sign Out

### Example

```typescript
const { error } = await supabase.auth.signOut()

if (!error) {
  router.push('/')
}
```

## Get Current User

### Server-Side (API Routes)

```typescript
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = createServerClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // User authenticated
  const userId = user.id
  const userEmail = user.email
  // ...
}
```

### Server Component

```typescript
import { createServerClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = createServerClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return <div>Welcome {user.email}</div>
}
```

### Client Component

```typescript
'use client'

import { useState, useEffect } from 'react'
import { getBrowserClient } from '@/lib/supabase/client'

export function UserProfile() {
  const [user, setUser] = useState(null)
  const supabase = getBrowserClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [])

  if (!user) return <div>Loading...</div>

  return <div>Welcome {user.email}</div>
}
```

## User Roles

DaanSetu supports three user roles:

| Role | Permissions | Use Case |
|------|-------------|----------|
| `user` | Donate, volunteer, post | Regular donors and volunteers |
| `ngo` | Create campaigns, manage NGO | NGO organizations |
| `admin` | Full access | Platform administrators |

### Checking User Role

```typescript
const { data: profile } = await supabase
  .from('users')
  .select('role')
  .eq('id', user.id)
  .single()

if (profile.role === 'ngo') {
  // Allow NGO operations
} else {
  return NextResponse.json(
    { error: 'Forbidden: NGO role required' },
    { status: 403 }
  )
}
```

## Protected Routes

### Middleware Protection

```typescript
// middleware.ts
import { createServerClient } from '@/lib/supabase/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { supabase, response } = createServerClient(request)

  const { data: { user } } = await supabase.auth.getUser()

  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard') && !user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Protect NGO routes
  if (request.nextUrl.pathname.startsWith('/ngo/dashboard')) {
    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // Check NGO role
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'ngo') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/ngo/dashboard/:path*']
}
```

## Session Management

### Session Duration

- **Access token**: 1 hour (default)
- **Refresh token**: 30 days (default)
- Auto-refresh handled by Supabase client

### Checking Session

```typescript
const { data: { session } } = await supabase.auth.getSession()

if (session) {
  console.log('User is logged in')
  console.log('Expires at:', session.expires_at)
} else {
  console.log('No active session')
}
```

### Listening for Auth Changes

```typescript
'use client'

useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      if (event === 'SIGNED_IN') {
        console.log('User signed in')
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out')
        router.push('/')
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed')
      }
    }
  )

  return () => subscription.unsubscribe()
}, [])
```

## Password Reset

### Request Reset

```typescript
const { error } = await supabase.auth.resetPasswordForEmail(
  'user@example.com',
  {
    redirectTo: `${window.location.origin}/auth/reset-password`
  }
)
```

### Update Password

```typescript
const { error } = await supabase.auth.updateUser({
  password: 'newPassword123'
})
```

## OAuth Providers

DaanSetu can be extended to support OAuth:

```typescript
// Sign in with Google (if configured)
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`
  }
})
```

**Note**: OAuth providers must be configured in Supabase dashboard.

## Security Best Practices

1. **Use httpOnly cookies**: Tokens stored securely (handled by Supabase)
2. **Validate on server**: Always check auth in API routes
3. **Use RLS**: Database enforces user permissions
4. **Rate limit**: Auth endpoints protected by rate limiting
5. **Strong passwords**: Enforce minimum 6 characters
6. **HTTPS only**: Use HTTPS in production

## Common Errors

### Invalid credentials

```json
{
  "error": "Invalid login credentials"
}
```

**Solution**: Check email/password are correct

### Email already exists

```json
{
  "error": "User already registered"
}
```

**Solution**: Use login instead of signup

### Session expired

```json
{
  "error": "Unauthorized"
}
```

**Solution**: Refresh token (handled automatically) or re-login

## Next Steps

- [AI Endpoints](./ai-endpoints.md) - AI features
- [Payment API](./payment.md) - Payment processing
- [Security Overview](../security/overview.md) - Security architecture
