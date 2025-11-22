# Quick Start Guide

Get DaanSetu up and running in 5 minutes!

## Prerequisites

Make sure you've completed the [Installation Guide](./installation.md) first.

## 1. Start the Development Server

```bash
cd DaanSetu
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) - you should see the DaanSetu homepage.

## 2. Create Your First Account

1. Click **"Sign Up"** in the top navigation
2. Enter your details:
   - Name: Your name
   - Email: test@example.com
   - Password: Choose a strong password
   - Role: Select "User" (or "NGO" if testing NGO features)
3. Click **"Sign Up"**

You'll be automatically logged in and redirected to the dashboard.

## 3. Explore Key Features

### Browse NGOs

1. Click **"NGOs"** in the navigation
2. Browse NGOs by category (Education, Health, Food, etc.)
3. Click on an NGO to view details
4. Try the **"Follow"** button to follow an NGO

### View Campaigns

1. Go to **"Campaigns"**
2. See active fundraising campaigns
3. Click on a campaign to view details
4. Notice the progress bar showing funding status

### Make a Test Donation

1. Open any campaign
2. Click **"Donate Now"**
3. Enter amount (e.g., ₹100)
4. Select cause and preferences
5. Click **"Proceed to Payment"**

**Note**: In development mode, Razorpay test mode is active. Use test card details:
- Card: 4111 1111 1111 1111
- CVV: 123
- Expiry: Any future date

### Try AI Recommendations

1. Go to your **Dashboard**
2. Scroll to **"AI Recommendations"**
3. Click **"Get Personalized Recommendations"**
4. View AI-suggested NGOs based on your interests

### Create a Post (Social Feature)

1. Click **"Community"** in navigation
2. Click **"Create Post"**
3. Write some text (e.g., "Excited to support education!")
4. Optionally upload an image
5. Click **"Post"**
6. Try liking and commenting on other posts

## 4. Test NGO Features (Optional)

Create an NGO account to test creator features:

1. Log out and sign up again with role **"NGO"**
2. Go to **"NGO Dashboard"**
3. Click **"Create Campaign"**
4. Fill in campaign details:
   - Title: "Help Build a School"
   - Description: Campaign details
   - Goal: ₹50,000
   - Category: Education
   - Deadline: Pick a future date
5. Upload an image
6. Click **"Create Campaign"**

## 5. Explore Volunteer Opportunities

1. Go to **"Volunteer"** section
2. Create your volunteer profile
3. Add skills (e.g., "Teaching", "Healthcare")
4. Browse available opportunities
5. Apply to opportunities matching your skills

## Understanding the Project Structure

```
DaanSetu/
├── app/                    # Next.js App Router
│   ├── api/               # API endpoints
│   ├── dashboard/         # User dashboard
│   ├── campaigns/         # Campaign pages
│   ├── ngos/             # NGO directory
│   └── ...
├── components/           # Reusable React components
├── lib/
│   ├── services/        # Business logic
│   ├── supabase/        # Database client
│   └── middleware/      # Rate limiting, etc.
└── supabase/            # Database schema & migrations
```

## Common Development Tasks

### View Database Tables

1. Open [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Table Editor**
4. Browse tables: users, ngos, campaigns, donations, etc.

### Check API Responses

Use browser DevTools or curl:

```bash
# Get all NGOs
curl http://localhost:3000/api/ngos

# Test AI recommendations (requires auth token)
curl -X POST http://localhost:3000/api/ai/recommend-ngos \
  -H "Content-Type: application/json" \
  -d '{"userContext": {...}}'
```

### Debug Issues

Check the terminal where `npm run dev` is running for:
- API errors
- Database connection issues
- Missing environment variables

Browser console (F12) shows:
- Frontend errors
- Network requests
- React warnings

## Next Steps

### Learn the Architecture

- [Architecture Overview](../architecture/overview.md) - System design
- [Frontend Architecture](../architecture/frontend.md) - React patterns
- [Backend Architecture](../architecture/backend.md) - API structure
- [Database Design](../architecture/database.md) - Schema & relationships

### Explore Features

- [Donation System](../features/donations.md) - Payment processing
- [AI Features](../features/ai-features.md) - Gemini integration
- [Social Features](../features/social-features.md) - Community engagement

### Build Something New

Try adding a new feature:

1. **Add a new API endpoint**:
   ```bash
   # Create new file
   touch app/api/test/route.ts
   ```

2. **Create a new service**:
   ```bash
   touch lib/services/my-feature.ts
   ```

3. **Add a new page**:
   ```bash
   mkdir app/my-page
   touch app/my-page/page.tsx
   ```

## Troubleshooting

### Issue: "Supabase client not initialized"

**Solution**: Check your `.env` file has correct `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Issue: "Gemini API error"

**Solution**:
1. Verify `GEMINI_API_KEY` in `.env` (no `NEXT_PUBLIC_` prefix!)
2. Check API quota at [Google AI Studio](https://makersuite.google.com)

### Issue: "Payment failed"

**Solution**:
1. Ensure Razorpay test keys are in `.env`
2. Use test card: 4111 1111 1111 1111
3. Check Razorpay dashboard for transaction logs

### Issue: Images not uploading

**Solution**:
1. Verify storage buckets exist in Supabase
2. Check bucket policies allow public read
3. Ensure file size < 5MB

## Development Tips

1. **Use TypeScript**: Leverage type safety - errors caught at compile time
2. **Check RLS policies**: If queries fail, verify Row Level Security policies
3. **Monitor rate limits**: Watch for 429 errors in browser console
4. **Use React DevTools**: Install browser extension for debugging
5. **Check Supabase logs**: Real-time logs in Supabase dashboard

## Resources

- [API Documentation](../api/overview.md)
- [Security Guide](../security/overview.md)
- [Deployment Guide](../deployment/vercel.md)
- [GitHub Issues](https://github.com/NoobSambit/DaanSetu/issues)

---

**Ready to dive deeper?** Check out the [Architecture Overview](../architecture/overview.md) to understand how everything works together!
