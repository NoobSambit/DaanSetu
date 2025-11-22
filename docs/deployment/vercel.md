# Vercel Deployment Guide

Deploy DaanSetu to Vercel in minutes.

## Prerequisites

- GitHub account with DaanSetu repository
- Vercel account ([Sign up free](https://vercel.com/signup))
- Completed [Installation Guide](../getting-started/installation.md)
- Production Supabase project configured
- Production Razorpay account

## Quick Deploy

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### Step 2: Import to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"New Project"**
3. Import your GitHub repository
4. Vercel auto-detects Next.js - click **"Deploy"**

### Step 3: Add Environment Variables

In Vercel project settings → Environment Variables, add:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Gemini AI (Server-side only - no NEXT_PUBLIC_)
GEMINI_API_KEY=AIzaSy...

# Razorpay (PRODUCTION keys)
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxx

# App Config
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

**Important**: Use **live** Razorpay keys for production, not test keys!

### Step 4: Redeploy

After adding environment variables:
1. Go to **Deployments** tab
2. Click **"..."** on latest deployment
3. Click **"Redeploy"**

## Custom Domain

### Add Domain

1. Go to project **Settings → Domains**
2. Enter your domain (e.g., `daansetu.com`)
3. Follow DNS configuration instructions
4. Wait for SSL certificate (automatic)

### Update Environment

```bash
NEXT_PUBLIC_APP_URL=https://daansetu.com
```

Redeploy after updating.

## Deployment Configuration

### vercel.json (optional)

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["bom1"]
}
```

**Regions**: Use `bom1` (Mumbai) for Indian users.

## Environment-Specific Builds

### Production Only Variables

Some variables only needed in production:

```bash
# Vercel auto-sets NODE_ENV=production
NODE_ENV=production

# Analytics (optional)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### Preview Deployments

Vercel creates preview deployments for each PR:
- Different URL for each branch
- Share same environment variables
- Test before merging

## Build Optimization

### Reduce Build Time

```typescript
// next.config.ts
const nextConfig = {
  // Disable source maps in production
  productionBrowserSourceMaps: false,

  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp']
  },

  // Minimize output
  compress: true
}
```

### Edge Functions (optional)

For low-latency API routes:

```typescript
// app/api/route.ts
export const runtime = 'edge'

export async function GET() {
  // Runs on edge network
}
```

## Performance Monitoring

### Vercel Analytics

Enable in project settings:
1. Go to **Analytics** tab
2. Enable **Web Analytics**
3. View real-time performance metrics

### Speed Insights

Track Core Web Vitals:
1. Enable **Speed Insights**
2. Monitor LCP, FID, CLS
3. Get improvement recommendations

## Troubleshooting

### Build Fails

**Check build logs**:
```
Error: Module not found
```

**Solution**: Ensure all dependencies in `package.json`

### Environment Variables Not Working

**Check**:
1. Variables saved in Vercel dashboard
2. Redeploy after adding variables
3. No typos in variable names

### API Routes Timeout

Vercel serverless functions timeout after 10s (free) / 60s (pro).

**Solution**:
- Optimize slow queries
- Use edge runtime
- Upgrade to Pro plan if needed

## Production Checklist

- [ ] All database migrations applied
- [ ] Supabase RLS policies enabled
- [ ] Storage buckets configured
- [ ] Razorpay in **live mode**
- [ ] Environment variables set
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Test payment flow end-to-end
- [ ] Monitor error logs
- [ ] Set up alerts

## Next Steps

- [Production Checklist](./production-checklist.md) - Complete checklist
- [Security Overview](../security/overview.md) - Security best practices

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
