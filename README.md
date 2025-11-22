# DaanSetu - Connecting Compassion with Action

DaanSetu is a comprehensive platform connecting donors, NGOs, volunteers, and corporates to maximize social impact across India. Built with Next.js 14, Supabase, and AI-powered recommendations.

## 🚀 Features

### Core Features
- **Smart Donation System**: Support NGOs and campaigns with secure payment processing via Razorpay
- **AI-Powered Recommendations**: Get personalized NGO and campaign suggestions using Google Gemini AI
- **Volunteer Management**: Find and apply for volunteer opportunities based on your skills
- **Campaign Management**: NGOs can create and manage fundraising campaigns with real-time tracking
- **Social Network**: Follow organizations, like and comment on posts, build community
- **Corporate CSR Module**: Manage employee donations and corporate social responsibility initiatives
- **Leaderboards & Gamification**: Earn badges and climb the ranks based on your contributions
- **Analytics Dashboard**: Comprehensive insights for NGOs and donors

### Technical Features
- **Server-Side Rendering**: Next.js 14 with App Router for optimal performance
- **Real-Time Updates**: Supabase real-time subscriptions
- **Image Upload**: Secure image storage via Supabase Storage
- **Rate Limiting**: Built-in API protection against abuse
- **Error Boundaries**: Graceful error handling throughout the application
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Type Safety**: Full TypeScript implementation

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** 18.x or higher
- **npm** or **yarn** package manager
- A **Supabase** account ([Sign up for free](https://supabase.com))
- A **Razorpay** account for payment processing ([Sign up](https://razorpay.com))
- A **Google Gemini API** key ([Get one here](https://makersuite.google.com/app/apikey))

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/NoobSambit/DaanSetu.git
cd DaanSetu
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings → API to find your credentials
3. Run the database migrations:
   - Go to the SQL Editor in your Supabase dashboard
   - Copy the contents of `supabase/schema.sql` and execute it
   - Then run all migrations in `supabase/migrations/` in order (007, 008, 009, 010)

4. Set up Storage buckets:
   - Go to Storage in your Supabase dashboard
   - Create the following buckets (all public):
     - `campaigns`
     - `ngos`
     - `posts`
     - `profiles`
     - `corporate`

### 4. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Gemini AI Configuration (Server-side only)
GEMINI_API_KEY=your-gemini-api-key-here

# Payment Gateway Configuration
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=your-razorpay-key-id

# Application Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important Security Notes:**
- Never commit the `.env` file to version control
- Use `GEMINI_API_KEY` (not `NEXT_PUBLIC_GEMINI_API_KEY`) to keep it server-side only
- Keep `RAZORPAY_KEY_SECRET` secure and never expose it to the client

### 5. Run Database Migrations

The critical fixes migration includes:
- Auto-create user profile trigger
- Atomic increment functions for campaigns
- Performance indexes
- Activity logging functions
- Optimized leaderboard queries

Make sure to run `supabase/migrations/010_critical_fixes.sql` in your Supabase SQL editor.

### 6. Start the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Project Structure

```
DaanSetu/
├── app/                      # Next.js 14 App Router
│   ├── api/                  # API routes
│   │   ├── ai/              # AI-powered endpoints (rate-limited)
│   │   ├── payment/         # Payment processing
│   │   ├── upload/          # Image upload
│   │   ├── posts/           # Social features
│   │   └── ...
│   ├── (auth)/              # Authentication pages
│   ├── campaigns/           # Campaign pages
│   ├── ngos/                # NGO directory
│   └── ...
├── components/              # React components
│   ├── ErrorBoundary.tsx   # Error handling
│   └── ...
├── lib/
│   ├── services/           # Business logic layer
│   │   ├── donations.ts    # Donation management
│   │   ├── campaigns.ts    # Campaign CRUD
│   │   ├── posts.ts        # Social features
│   │   ├── gemini.ts       # AI integration
│   │   └── ...
│   ├── supabase/           # Supabase client setup
│   │   ├── client.ts       # Browser client
│   │   ├── server.ts       # Server client
│   │   └── index.ts        # Unified access
│   ├── middleware/         # Custom middleware
│   │   └── rate-limit.ts   # Rate limiting
│   └── types/              # TypeScript types
├── supabase/
│   ├── schema.sql          # Initial database schema
│   └── migrations/         # Database migrations
└── public/                 # Static assets
```

## 🔧 Configuration

### Rate Limits

Configure rate limits in `lib/middleware/rate-limit.ts`:

```typescript
export const RATE_LIMITS = {
  AI: { windowMs: 60 * 1000, maxRequests: 10 },      // AI endpoints
  UPLOAD: { windowMs: 60 * 1000, maxRequests: 20 },  // Upload endpoints
  PAYMENT: { windowMs: 60 * 1000, maxRequests: 30 }, // Payment endpoints
  DEFAULT: { windowMs: 60 * 1000, maxRequests: 100 }, // General API
}
```

### Payment Integration

1. Create a Razorpay account at [razorpay.com](https://razorpay.com)
2. Go to Settings → API Keys
3. Copy the Key ID and Key Secret to your `.env` file
4. Test mode is enabled by default for development

### AI Features

The platform uses Google Gemini AI for:
- Personalized NGO recommendations
- Campaign suggestions based on user interests
- Content quality analysis

To enable AI features:
1. Get an API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add it to `.env` as `GEMINI_API_KEY`
3. AI responses are cached for 1 hour to reduce costs

## 📊 Database Schema

Key tables:
- `users` - User profiles (auto-created on signup)
- `ngos` - NGO organizations
- `campaigns` - Fundraising campaigns
- `donations` - Donation records with payment tracking
- `posts` - Social media posts
- `volunteers` - Volunteer profiles and applications
- `corporate_campaigns` - Corporate CSR campaigns
- `badges` - Gamification achievements
- `activity_logs` - User activity tracking

See `supabase/schema.sql` for complete schema.

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Add environment variables in Vercel project settings
4. Deploy!

### Environment Variables for Production

Make sure to set all the same environment variables in your Vercel project:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`

### Production Checklist

- ✅ Run all database migrations
- ✅ Set up Supabase Storage buckets
- ✅ Configure RLS policies in Supabase
- ✅ Set Razorpay to live mode
- ✅ Update `NEXT_PUBLIC_APP_URL` to your domain
- ✅ Test payment flow end-to-end
- ✅ Monitor rate limit logs
- ✅ Set up error tracking (optional: Sentry)

## 🔒 Security

- **RLS Policies**: Row Level Security enabled on all Supabase tables
- **Rate Limiting**: All API routes are rate-limited
- **Input Validation**: Server-side validation on all inputs
- **Payment Security**: Razorpay signature verification
- **Environment Variables**: Sensitive keys kept server-side
- **CORS**: Configured for production domain only

## 🧪 Testing

```bash
# Run tests (if configured)
npm test

# Type checking
npm run type-check

# Linting
npm run lint
```

## 📈 Performance Optimizations

- ✅ Database indexes on frequently queried columns
- ✅ Atomic operations to prevent race conditions
- ✅ Pagination on all list endpoints
- ✅ AI response caching
- ✅ Optimized SQL queries with aggregation
- ✅ Image optimization with Supabase Storage
- ✅ Server-side rendering for SEO

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:
1. Check the [Issues](https://github.com/NoobSambit/DaanSetu/issues) page
2. Review the `FIXES_APPLIED.md` for recent changes
3. Ensure all environment variables are correctly set
4. Verify database migrations have been run

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Database by [Supabase](https://supabase.com)
- Payments by [Razorpay](https://razorpay.com)
- AI by [Google Gemini](https://ai.google.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com)

---

Made with ❤️ for social good
