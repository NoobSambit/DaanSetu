# Installation Guide

This guide will walk you through setting up DaanSetu on your local development environment.

## Prerequisites

Before you begin, ensure you have the following installed and configured:

### Required Software

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **npm** or **yarn** package manager (comes with Node.js)
- **Git** for version control ([Download](https://git-scm.com/))

### Required Accounts

- **Supabase Account** - Free tier available ([Sign up](https://supabase.com))
- **Razorpay Account** - For payment processing ([Sign up](https://razorpay.com))
- **Google AI Studio** - For Gemini API key ([Get API key](https://makersuite.google.com/app/apikey))

## Step 1: Clone the Repository

```bash
git clone https://github.com/NoobSambit/DaanSetu.git
cd DaanSetu
```

## Step 2: Install Dependencies

Using npm:
```bash
npm install
```

Using yarn:
```bash
yarn install
```

This will install all required dependencies:

- **Next.js 15.1.0** - React framework
- **@supabase/supabase-js 2.39.0** - Supabase client
- **@google/generative-ai 0.24.1** - Gemini AI SDK
- **React 18.3.1** - UI library
- **Tailwind CSS 3.4.0** - Styling
- **Leaflet** - Interactive maps
- **Recharts** - Data visualization
- **TypeScript 5.3.3** - Type safety

## Step 3: Set Up Supabase

### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Choose an organization (or create one)
4. Enter project details:
   - **Name**: DaanSetu
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Select closest to your users
5. Click **"Create new project"** and wait for setup to complete (~2 minutes)

### Get Your API Credentials

1. In your Supabase project dashboard, go to **Settings → API**
2. Copy the following values:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public** key: `eyJhbGc...` (long string)

### Run Database Migrations

1. In your Supabase dashboard, click **SQL Editor** in the left sidebar
2. Create a new query
3. Copy the entire contents of `supabase/schema.sql` from the repo
4. Click **Run** to execute the base schema
5. Repeat for each migration file in order:
   - `supabase/migrations/007_corporate_csr_module.sql`
   - `supabase/migrations/008_social_community_layer.sql`
   - `supabase/migrations/009_phase8_enhancements.sql`
   - `supabase/migrations/010_critical_fixes.sql`
   - `supabase/migrations/011_security_fixes.sql`
   - `supabase/migrations/012_performance_indexes.sql`

### Set Up Storage Buckets

1. Go to **Storage** in your Supabase dashboard
2. Create the following buckets (click **"New bucket"** for each):

| Bucket Name | Public Access | Purpose |
|-------------|---------------|---------|
| `campaigns` | ✅ Public | Campaign images |
| `ngos` | ✅ Public | NGO profile images |
| `posts` | ✅ Public | Social media post images |
| `profiles` | ✅ Public | User profile pictures |
| `corporate` | ✅ Public | Corporate campaign images |

## Step 4: Set Up Razorpay

1. Sign up at [razorpay.com](https://razorpay.com)
2. Go to **Settings → API Keys** in the dashboard
3. Click **"Generate Test Key"** (for development)
4. Copy both:
   - **Key ID**: `rzp_test_xxxxx`
   - **Key Secret**: `xxxxxxxxxxxxxx` (keep this secret!)

## Step 5: Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Select a Google Cloud project (or create one)
5. Copy the generated API key

## Step 6: Configure Environment Variables

1. Create a `.env` file in the project root:

```bash
cp .env.example .env
```

2. Open `.env` and add your credentials:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Gemini AI Configuration (Server-side only - do NOT use NEXT_PUBLIC_)
GEMINI_API_KEY=your-gemini-api-key-here

# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx

# Application Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**⚠️ Important Security Notes:**

- Use `GEMINI_API_KEY` (NOT `NEXT_PUBLIC_GEMINI_API_KEY`) to keep it server-side only
- Never commit `.env` to version control
- Keep `RAZORPAY_KEY_SECRET` secure

## Step 7: Start the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Verify Installation

1. Open [http://localhost:3000](http://localhost:3000) in your browser
2. You should see the DaanSetu homepage
3. Click **"Sign Up"** to create a test account
4. Try browsing NGOs and campaigns

## Common Issues

### Port Already in Use

If port 3000 is busy:
```bash
npm run dev -- -p 3001
```

### Supabase Connection Error

- Verify your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Check that your project is active in Supabase dashboard
- Ensure migrations were run successfully

### Missing Environment Variables

If you see errors about missing env vars:
```bash
# Check your .env file has all required variables
cat .env

# Make sure there are no spaces around = signs
# ✅ Correct: GEMINI_API_KEY=abc123
# ❌ Wrong: GEMINI_API_KEY = abc123
```

## Next Steps

- [Configuration Guide](./configuration.md) - Learn about all config options
- [Quick Start Guide](./quick-start.md) - Build your first feature
- [Architecture Overview](../architecture/overview.md) - Understand the system

## Need Help?

- Check the [Troubleshooting Guide](../development/troubleshooting.md)
- Open an [issue on GitHub](https://github.com/NoobSambit/DaanSetu/issues)
