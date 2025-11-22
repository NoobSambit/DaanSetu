# Security Overview

DaanSetu implements multiple security layers to protect user data and prevent attacks.

## Security Architecture

```
┌─────────────────────────────────────┐
│       Defense in Depth              │
│                                     │
│  1. Client Validation (UX only)    │
│  2. Rate Limiting (API Layer)      │
│  3. Authentication (Supabase Auth) │
│  4. Authorization (RLS Policies)   │
│  5. Input Validation (Server)      │
│  6. Payment Verification (Crypto)  │
│  7. Database Constraints (Schema)  │
└─────────────────────────────────────┘
```

## Authentication & Authorization

### Supabase Auth

- **JWT Tokens**: Secure, httpOnly cookies
- **Session Management**: Auto-refresh tokens
- **Password Requirements**: Minimum 6 characters
- **Email Verification**: Optional (recommended for production)

### Row Level Security (RLS)

Every table has RLS policies:

```sql
-- Example: Users can only view their own donations
CREATE POLICY "users_view_own" ON donations
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
```

See [RLS Policies](./rls-policies.md) for complete policies.

## API Security

### Rate Limiting

All endpoints rate-limited via token bucket algorithm:

| Endpoint Type | Limit |
|--------------|-------|
| AI | 10 req/min |
| Upload | 20 req/min |
| Payment | 30 req/min |
| Default | 100 req/min |

Implementation: `lib/middleware/rate-limit.ts`

### Input Validation

Server-side validation on all inputs:

```typescript
// Validate amount
if (amount < 10 || amount > 10000000) {
  return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
}

// Validate content length
if (content.length > 5000) {
  return NextResponse.json({ error: 'Content too long' }, { status: 400 })
}
```

### Authentication Checks

Every protected endpoint:

```typescript
const { data: { user }, error } = await supabase.auth.getUser()

if (error || !user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

## Payment Security

### Razorpay Integration

- **Signature Verification**: All payments verified server-side
- **HTTPS Only**: Payment modal requires HTTPS
- **PCI Compliance**: Handled by Razorpay (PCI DSS Level 1)

### Payment Verification

```typescript
import crypto from 'crypto'

const sign = razorpay_order_id + '|' + razorpay_payment_id
const expectedSign = crypto
  .createHmac('sha256', RAZORPAY_KEY_SECRET)
  .update(sign)
  .digest('hex')

if (razorpay_signature !== expectedSign) {
  throw new Error('Invalid signature')
}
```

**Never trust client** - always verify on server.

## Data Protection

### Sensitive Data

| Data Type | Protection |
|-----------|------------|
| Passwords | Hashed by Supabase Auth (bcrypt) |
| Payment Keys | Server-side only, never exposed |
| User Emails | RLS policies prevent unauthorized access |
| Anonymous Donations | `is_anonymous` flag hides donor identity |

### API Keys

```bash
# ✅ Correct - Server-side only
GEMINI_API_KEY=xxx
RAZORPAY_KEY_SECRET=xxx

# ❌ Wrong - Would expose to client
NEXT_PUBLIC_GEMINI_API_KEY=xxx
NEXT_PUBLIC_RAZORPAY_KEY_SECRET=xxx
```

**Rule**: Only use `NEXT_PUBLIC_` for truly public data.

## Common Vulnerabilities

### SQL Injection

**Protected by**: Supabase parameterized queries

```typescript
// ✅ Safe - Parameterized
await supabase
  .from('campaigns')
  .select('*')
  .eq('id', userInput)

// ❌ Dangerous - Raw SQL (never do this)
await supabase.raw(`SELECT * FROM campaigns WHERE id = '${userInput}'`)
```

### XSS (Cross-Site Scripting)

**Protected by**: React auto-escapes content

```typescript
// ✅ Safe - React escapes automatically
<div>{userContent}</div>

// ⚠️  Dangerous - Only use for trusted content
<div dangerouslySetInnerHTML={{ __html: userContent }} />
```

### CSRF (Cross-Site Request Forgery)

**Protected by**: Supabase JWT tokens in httpOnly cookies

- Tokens not accessible to JavaScript
- SameSite cookie policy
- Origin validation

### Payment Fraud

**Protected by**:
1. Server-side signature verification
2. Razorpay fraud detection
3. Rate limiting on payment endpoints
4. Amount validation (min/max limits)

## Security Best Practices

### For Developers

1. **Never log sensitive data**
   ```typescript
   // ❌ Bad
   console.log('Payment key:', RAZORPAY_KEY_SECRET)

   // ✅ Good
   console.log('Processing payment...')
   ```

2. **Validate all inputs**
   ```typescript
   if (!amount || typeof amount !== 'number' || amount < 10) {
     throw new Error('Invalid amount')
   }
   ```

3. **Use RLS policies**
   - Enable RLS on all tables
   - Test policies thoroughly
   - Never disable RLS in production

4. **Rate limit everything**
   - Especially expensive operations (AI, payments)
   - Track by user ID when authenticated

5. **Handle errors securely**
   ```typescript
   try {
     // Operation
   } catch (error) {
     // ❌ Bad - exposes internals
     return NextResponse.json({ error: error.message })

     // ✅ Good - generic message
     return NextResponse.json({ error: 'Operation failed' })
   }
   ```

### For Production

1. **Use HTTPS only** (Vercel enables by default)
2. **Enable Supabase RLS** on all tables
3. **Rotate API keys** regularly
4. **Monitor logs** for suspicious activity
5. **Keep dependencies updated**
   ```bash
   npm audit
   npm update
   ```

6. **Use environment-specific keys**
   - Development: Test keys
   - Production: Live keys
   - Never mix environments

## Security Headers

Configured via `next.config.ts`:

```typescript
const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  }
]
```

## Monitoring & Alerts

### What to Monitor

- Failed login attempts (brute force detection)
- Payment failures (fraud patterns)
- Rate limit hits (abuse detection)
- Database errors (injection attempts)
- API errors (service health)

### Logging

```typescript
// Log security events
console.error('Security event:', {
  type: 'failed_login',
  email: email,
  ip: request.ip,
  timestamp: new Date()
})
```

**Recommended**: Integrate with error tracking (Sentry, LogRocket)

## Incident Response

### If Breach Suspected

1. **Isolate**: Disable affected accounts
2. **Investigate**: Check logs for attack vector
3. **Notify**: Alert affected users
4. **Patch**: Fix vulnerability
5. **Monitor**: Watch for repeat attempts

### Emergency Contacts

- **Supabase Support**: support@supabase.io
- **Razorpay Security**: security@razorpay.com
- **Vercel Support**: support@vercel.com

## Compliance

### Data Privacy

- **GDPR**: User data deletion supported
- **Data Minimization**: Collect only necessary data
- **Right to Access**: Users can export their data

### Payment Compliance

- **PCI DSS**: Handled by Razorpay (Level 1)
- **No card storage**: Cards never touch DaanSetu servers
- **Secure transmission**: HTTPS + Razorpay encryption

## Security Audit

Regular security checks:

- [ ] All dependencies updated
- [ ] No exposed secrets in code
- [ ] RLS policies tested
- [ ] Rate limiting working
- [ ] Payment verification working
- [ ] Input validation comprehensive
- [ ] Error handling secure
- [ ] Logs reviewed for issues

## Next Steps

- [RLS Policies](./rls-policies.md) - Complete RLS policy documentation
- [Best Practices](./best-practices.md) - Security best practices
- [Payment Security](../api/payment.md) - Payment security details

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Razorpay Security](https://razorpay.com/docs/payments/security/)
