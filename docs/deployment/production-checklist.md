# Production Checklist

Complete checklist before launching DaanSetu to production.

## Pre-Deployment

### Database

- [ ] All migrations applied to production Supabase
- [ ] RLS policies enabled on all tables
- [ ] Indexes created for performance
- [ ] Database functions tested (`increment_campaign_amount`, etc.)
- [ ] Triggers working (`handle_new_user`, `update_updated_at`)

### Storage

- [ ] All buckets created: `campaigns`, `ngos`, `posts`, `profiles`, `corporate`
- [ ] Bucket policies configured (public read)
- [ ] File size limits set (5MB recommended)
- [ ] MIME type restrictions configured

### Authentication

- [ ] Email confirmation enabled (recommended)
- [ ] Password requirements set (min 6 characters)
- [ ] JWT expiry configured
- [ ] Auth redirects working

### Payments

- [ ] Razorpay switched to **live mode**
- [ ] Live API keys in environment variables
- [ ] Test donation flow end-to-end with real card
- [ ] Refund process documented
- [ ] Payment failure handling tested

### AI Features

- [ ] Gemini API key quota sufficient
- [ ] API key server-side only (no `NEXT_PUBLIC_`)
- [ ] Rate limiting configured
- [ ] Caching working (1-hour TTL)
- [ ] Fallback for AI failures

## Environment Variables

Verify all production environment variables:

```bash
# Supabase
✓ NEXT_PUBLIC_SUPABASE_URL
✓ NEXT_PUBLIC_SUPABASE_ANON_KEY

# AI
✓ GEMINI_API_KEY (server-side only!)

# Payments
✓ RAZORPAY_KEY_ID (rzp_live_xxx)
✓ RAZORPAY_KEY_SECRET
✓ NEXT_PUBLIC_RAZORPAY_KEY_ID (rzp_live_xxx)

# App
✓ NODE_ENV=production
✓ NEXT_PUBLIC_APP_URL (your actual domain)
```

## Security

- [ ] RLS enabled on all tables
- [ ] Rate limiting active on all API routes
- [ ] Input validation on all forms
- [ ] Payment signature verification working
- [ ] HTTPS enforced (Vercel does this automatically)
- [ ] CORS configured
- [ ] No sensitive data in logs
- [ ] `.env` in `.gitignore`

## Performance

- [ ] Database indexes created
- [ ] Images optimized with Next.js Image
- [ ] Lazy loading for heavy components
- [ ] API routes use pagination
- [ ] AI responses cached
- [ ] Build size optimized

## Testing

- [ ] Sign up flow tested
- [ ] Login flow tested
- [ ] Donation flow tested with real card
- [ ] Campaign creation tested
- [ ] Volunteer application tested
- [ ] Social features (post, like, comment) tested
- [ ] AI recommendations tested
- [ ] Mobile responsiveness verified
- [ ] Cross-browser testing (Chrome, Firefox, Safari)

## Monitoring

- [ ] Vercel Analytics enabled
- [ ] Error logging configured
- [ ] Payment logs monitored
- [ ] Database performance monitored
- [ ] API rate limit logs checked

## Legal & Compliance

- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Refund policy documented
- [ ] GDPR compliance (if applicable)
- [ ] Payment gateway TOS accepted

## Documentation

- [ ] User guide published
- [ ] FAQ created
- [ ] Support email configured
- [ ] Contact page working

## Launch

- [ ] Staging environment tested
- [ ] Production domain configured
- [ ] SSL certificate active
- [ ] Redirects working (www → non-www or vice versa)
- [ ] 404 page configured
- [ ] Error pages customized

## Post-Launch

- [ ] Monitor error logs for first 24 hours
- [ ] Test all critical flows
- [ ] Monitor payment success rate
- [ ] Check database performance
- [ ] Verify email delivery
- [ ] Monitor AI API usage
- [ ] Backup database (Supabase auto-backup enabled)

## Emergency Contacts

Document contact information for:
- [ ] Vercel support
- [ ] Supabase support
- [ ] Razorpay support
- [ ] Domain registrar
- [ ] Team members with admin access

## Rollback Plan

- [ ] Previous working version tagged in Git
- [ ] Database backup before migration
- [ ] Rollback procedure documented
- [ ] Vercel instant rollback available

## Marketing

- [ ] SEO meta tags configured
- [ ] Open Graph tags set
- [ ] Social media previews working
- [ ] Analytics tracking setup
- [ ] Sitemap generated

---

**Sign-off**: I confirm all items are checked and DaanSetu is ready for production.

Name: _________________ Date: _________________
