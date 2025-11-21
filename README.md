# DaanSetu - NGO Discovery Platform

A production-quality web application built with Next.js App Router, TypeScript, and TailwindCSS for discovering and connecting with NGOs across India.

## Features

- **User Authentication**: Secure email/password authentication powered by Supabase Auth
- **NGO Profiles**: Detailed profiles with name, description, location, and category
- **Interactive Map**: OpenStreetMap + Leaflet integration showing NGO locations
- **Search & Filters**: Find NGOs by category, city, and keywords
- **Responsive Design**: Clean, minimal UI that works on all devices

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Maps**: Leaflet + OpenStreetMap
- **Deployment Ready**: Vercel-optimized

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account and project
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd DaanSetu
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**

   a. Create a new project at [supabase.com](https://supabase.com)

   b. Go to Project Settings > API to find your credentials

   c. Go to SQL Editor and run the schema from `supabase/schema.sql`

4. **Configure environment variables**

   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the app.

## Database Schema

### Users Table
- `id` (UUID, Primary Key)
- `name` (Text)
- `email` (Text, Unique)
- `role` (Enum: 'user', 'ngo', 'admin')
- `created_at` (Timestamp)

### NGOs Table
- `id` (UUID, Primary Key)
- `name` (Text)
- `description` (Text)
- `city` (Text)
- `state` (Text)
- `category` (Enum: 'education', 'food', 'health', 'women', 'animals')
- `latitude` (Float)
- `longitude` (Float)
- `user_id` (UUID, Foreign Key)
- `created_at` (Timestamp)

## Project Structure

```
DaanSetu/
├── app/
│   ├── auth/
│   │   ├── login/
│   │   └── signup/
│   ├── ngos/
│   │   ├── [id]/
│   │   └── page.tsx
│   ├── map/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── Header.tsx
│   ├── NGOList.tsx
│   ├── NGOMap.tsx
│   └── SearchFilters.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   └── types/
│       └── database.types.ts
├── supabase/
│   └── schema.sql
└── middleware.ts
```

## Key Features Explained

### Authentication
- Sign up and login with email/password
- Automatic session management with Supabase
- Protected routes and user-specific features

### NGO Discovery
- Browse all NGOs in a card-based layout
- Filter by category (Education, Food, Health, Women, Animals)
- Search by city or keywords
- View detailed NGO profiles

### Interactive Map
- Visualize all NGOs on an OpenStreetMap
- Color-coded markers by category
- Click markers to view NGO details
- Responsive map controls

### Search & Filters
- Real-time search functionality
- Category dropdown filter
- City-based filtering
- Combined filter support

## Building for Production

```bash
npm run build
npm start
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

## Environment Variables

Make sure to set these in your deployment platform:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Future Enhancements (Phase 2+)

- Donation system integration
- AI-powered NGO recommendations
- User reviews and ratings
- NGO verification system
- Advanced analytics dashboard

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for your own purposes.

## Support

For issues and questions, please create an issue in the GitHub repository.

---

Built with ❤️ for social good
