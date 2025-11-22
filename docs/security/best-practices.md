# Security Best Practices

Essential security practices for DaanSetu development and deployment.

## Environment Variables

### ✅ DO

```bash
# Server-side secrets (no NEXT_PUBLIC_ prefix)
GEMINI_API_KEY=xxx
RAZORPAY_KEY_SECRET=xxx
SUPABASE_SERVICE_KEY=xxx

# Public values (NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_SUPABASE_URL=xxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=xxx
```

### ❌ DON'T

```bash
# Never expose secrets with NEXT_PUBLIC_
NEXT_PUBLIC_GEMINI_API_KEY=xxx  # ❌ Exposed to browser!
NEXT_PUBLIC_RAZORPAY_SECRET=xxx  # ❌ Security breach!
```

## Authentication

### ✅ DO

- Always check auth in API routes
- Use `createServerClient()` for server-side auth
- Validate JWT tokens on server
- Use httpOnly cookies (handled by Supabase)

```typescript
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

### ❌ DON'T

- Trust client-side auth checks (easily bypassed)
- Store tokens in localStorage (XSS vulnerable)
- Skip authentication checks in API routes

## Input Validation

### ✅ DO

- Validate all inputs server-side
- Set length limits
- Type check values
- Sanitize user content

```typescript
// Validate amount
if (!amount || typeof amount !== 'number' || amount < 10 || amount > 1000000) {
  return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
}

// Validate string length
if (content.length > 5000) {
  return NextResponse.json({ error: 'Content too long' }, { status: 400 })
}
```

### ❌ DON'T

```typescript
// ❌ No validation
const { data } = await supabase.from('posts').insert({ content })

// ❌ Client-side only validation
if (amount > 0) { /* proceed */ }  // Can be bypassed!
```

## Database Security

### ✅ DO

- Enable RLS on all tables
- Use parameterized queries (Supabase does this)
- Create specific policies per operation
- Test policies thoroughly

```sql
-- Specific policy
CREATE POLICY "users_own_donations"
  ON donations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
```

### ❌ DON'T

```sql
-- ❌ Too permissive
CREATE POLICY "view_all"
  ON donations FOR SELECT
  USING (true);

-- ❌ RLS disabled (never in production!)
ALTER TABLE donations DISABLE ROW LEVEL SECURITY;
```

## Payment Security

### ✅ DO

- Always verify payment signatures server-side
- Re-validate amount on server (don't trust client)
- Use HTTPS only (Vercel handles this)
- Log all payment attempts

```typescript
// Verify signature
const expectedSign = crypto
  .createHmac('sha256', RAZORPAY_KEY_SECRET)
  .update(sign)
  .digest('hex')

if (razorpay_signature !== expectedSign) {
  throw new Error('Invalid signature')
}
```

### ❌ DON'T

- Trust payment success from client without verification
- Expose Razorpay secret key
- Skip amount validation

## Error Handling

### ✅ DO

- Return generic error messages to client
- Log detailed errors server-side
- Use appropriate HTTP status codes

```typescript
try {
  // Operation
} catch (error) {
  console.error('Detailed error:', error)  // Server logs
  return NextResponse.json(
    { error: 'Operation failed' },  // Generic to client
    { status: 500 }
  )
}
```

### ❌ DON'T

```typescript
// ❌ Exposes internals
catch (error) {
  return NextResponse.json({ error: error.message })
}

// ❌ No logging
catch (error) {
  return NextResponse.json({ error: 'Failed' })
}
```

## Rate Limiting

### ✅ DO

- Rate limit all API endpoints
- Use stricter limits for expensive operations
- Track by user ID when possible

```typescript
export const GET = withRateLimit(handler, RATE_LIMITS.AI)
```

### ❌ DON'T

- Leave endpoints unprotected
- Use same limit for all endpoints

## Dependencies

### ✅ DO

- Keep dependencies updated
- Run security audits regularly
- Review dependency permissions

```bash
npm audit
npm update
npm audit fix
```

### ❌ DON'T

- Ignore audit warnings
- Use unmaintained packages

## Code Security

### ✅ DO

- Use TypeScript for type safety
- Enable strict mode
- Avoid `dangerouslySetInnerHTML`
- Sanitize user HTML/markdown

```typescript
// Safe - React escapes automatically
<div>{userContent}</div>
```

### ❌ DON'T

```typescript
// ❌ XSS vulnerable
<div dangerouslySetInnerHTML={{ __html: userContent }} />

// ❌ No type safety
const amount = request.body.amount  // Could be anything!
```

## File Uploads

### ✅ DO

- Validate file types
- Limit file sizes
- Use Supabase Storage (handles security)
- Check MIME types

```typescript
if (file.size > 5 * 1024 * 1024) {  // 5MB
  throw new Error('File too large')
}

if (!['image/jpeg', 'image/png'].includes(file.type)) {
  throw new Error('Invalid file type')
}
```

### ❌ DON'T

- Allow unlimited file sizes
- Trust client-provided file types
- Store files on server filesystem

## Logging

### ✅ DO

- Log security events
- Monitor failed attempts
- Track rate limit hits
- Use structured logging

```typescript
console.error('Security event:', {
  type: 'failed_login',
  email,
  ip: request.headers.get('x-forwarded-for'),
  timestamp: new Date()
})
```

### ❌ DON'T

```typescript
// ❌ Logs sensitive data
console.log('User password:', password)

// ❌ Logs payment secrets
console.log('Razorpay secret:', RAZORPAY_KEY_SECRET)
```

## Production Deployment

### ✅ DO

- Use environment-specific keys
- Enable HTTPS (automatic on Vercel)
- Set security headers
- Monitor error logs
- Rotate API keys regularly

### ❌ DON'T

- Use test keys in production
- Disable security features "temporarily"
- Commit `.env` to git
- Share API keys in chat/email

## Data Privacy

### ✅ DO

- Collect minimum necessary data
- Respect anonymous donation flag
- Allow users to delete their data
- Document privacy policy

### ❌ DON'T

- Store unnecessary personal data
- Share user data without consent
- Keep deleted user data

## Quick Security Checklist

Before every release:

- [ ] All secrets server-side only
- [ ] RLS enabled on all tables
- [ ] Input validation comprehensive
- [ ] Payment verification working
- [ ] Rate limiting active
- [ ] Error handling secure (generic messages)
- [ ] Dependencies updated
- [ ] HTTPS enforced
- [ ] Logs reviewed
- [ ] `.env` in `.gitignore`

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/security)
- [Supabase Security](https://supabase.com/docs/guides/auth/row-level-security)
