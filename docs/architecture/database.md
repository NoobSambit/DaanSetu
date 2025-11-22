# Database Architecture

DaanSetu uses Supabase (PostgreSQL) for data storage with a well-structured schema designed for scalability, security, and performance.

## Database Technology

- **Database**: PostgreSQL 15+ (via Supabase)
- **ORM**: Supabase JS Client (query builder)
- **Security**: Row Level Security (RLS)
- **Real-time**: Supabase real-time subscriptions
- **Storage**: Supabase Storage (S3-compatible)

## Entity Relationship Diagram

```
┌──────────────┐
│    users     │
└──────┬───────┘
       │
       ├──────────────────┬────────────────────┬──────────────────┐
       │                  │                    │                  │
       ▼                  ▼                    ▼                  ▼
┌─────────────┐    ┌───────────────┐   ┌─────────────┐   ┌──────────────┐
│    ngos     │    │   donations   │   │    posts    │   │  volunteer   │
│             │    │               │   │             │   │  _profiles   │
└──────┬──────┘    └───────┬───────┘   └──────┬──────┘   └──────────────┘
       │                   │                  │
       │                   │                  ├──────┐
       ▼                   ▼                  ▼      ▼
┌─────────────┐    ┌───────────────┐   ┌──────────────┐
│  campaigns  │    │   activity_   │   │    likes     │
│             │    │     logs      │   │   comments   │
└──────┬──────┘    └───────────────┘   │   bookmarks  │
       │                                │   follows    │
       ▼                                └──────────────┘
┌────────────────┐
│   campaign_    │
│    updates     │
└────────────────┘
```

## Core Tables

### users

User accounts with role-based access.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'user'
    CHECK (role IN ('user', 'ngo', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes**:
- Primary key on `id`
- Unique index on `email`

**RLS Policies**:
- All authenticated users can view profiles
- Users can update their own profile

**Relationships**:
- One-to-many with `ngos`
- One-to-many with `donations`
- One-to-many with `posts`
- One-to-one with `volunteer_profiles`

### ngos

NGO organizations registered on the platform.

```sql
CREATE TABLE ngos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  category TEXT NOT NULL
    CHECK (category IN ('education', 'food', 'health', 'women', 'animals')),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes**:
- `idx_ngos_category` on `category`
- `idx_ngos_city` on `city`
- `idx_ngos_user_id` on `user_id`
- `idx_ngos_created_at` on `created_at`

**RLS Policies**:
- Anyone (including anonymous) can view NGOs
- Authenticated users can create NGOs
- Users can update/delete their own NGOs

### campaigns

Fundraising campaigns created by NGOs.

```sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_id UUID NOT NULL REFERENCES ngos(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  short_description TEXT NOT NULL,
  description TEXT NOT NULL,
  goal_amount DECIMAL(10, 2) NOT NULL CHECK (goal_amount > 0),
  current_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  image_url TEXT,
  category TEXT NOT NULL
    CHECK (category IN ('education', 'food', 'health', 'disaster', 'women', 'animals')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes**:
- `idx_campaigns_ngo_id` on `ngo_id`
- `idx_campaigns_category` on `category`
- `idx_campaigns_status` on `status`
- `idx_campaigns_deadline` on `deadline`

**Key Features**:
- **Atomic updates**: Use `increment_campaign_amount()` function for race-free amount updates
- **Progress tracking**: `current_amount / goal_amount` shows progress
- **Status management**: Auto-complete when goal reached or deadline passed

### donations

Donation transactions with payment tracking.

```sql
CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ngo_id UUID NOT NULL REFERENCES ngos(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  cause TEXT NOT NULL
    CHECK (cause IN ('education', 'hunger', 'healthcare', 'disaster', 'general')),
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  payment_status TEXT NOT NULL DEFAULT 'completed'
    CHECK (payment_status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes**:
- `idx_donations_user_id` on `user_id`
- `idx_donations_ngo_id` on `ngo_id`
- `idx_donations_campaign_id` on `campaign_id`

**RLS Policies**:
- Users can view their own donations
- NGOs can view donations made to them
- Authenticated users can create donations

### posts

Social media posts for community engagement.

```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(content) <= 5000),
  image_url TEXT,
  hashtags TEXT[] DEFAULT '{}',
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes**:
- `idx_posts_user_id` on `user_id`
- `idx_posts_created_at` on `created_at`
- `idx_posts_hashtags` (GIN index) on `hashtags`

## Supporting Tables

### volunteer_profiles

Volunteer user profiles with skills.

```sql
CREATE TABLE volunteer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  city TEXT NOT NULL,
  skills TEXT[] NOT NULL DEFAULT '{}',
  availability TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes**:
- `idx_volunteer_profiles_skills` (GIN index) for array searching

### volunteer_opportunities

Volunteer opportunities posted by NGOs.

```sql
CREATE TABLE volunteer_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_id UUID NOT NULL REFERENCES ngos(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  city TEXT NOT NULL,
  required_skills TEXT[] NOT NULL DEFAULT '{}',
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  total_needed INTEGER NOT NULL CHECK (total_needed > 0),
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### corporate_campaigns

Corporate CSR campaigns with employee matching.

```sql
CREATE TABLE corporate_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  ngo_id UUID REFERENCES ngos(id),
  goal_amount DECIMAL(10, 2) NOT NULL,
  current_amount DECIMAL(10, 2) DEFAULT 0,
  matching_percentage INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### badges

Gamification achievements.

```sql
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Badge Types**:
- `first_donation` - First donation made
- `generous_donor` - Donated over ₹10,000
- `super_donor` - Donated over ₹50,000
- `active_volunteer` - 5+ volunteer applications
- `social_butterfly` - 50+ posts/comments
- `impact_maker` - Supported 10+ campaigns

## Database Functions

### increment_campaign_amount

Atomically update campaign amount (prevents race conditions).

```sql
CREATE OR REPLACE FUNCTION increment_campaign_amount(
  campaign_id UUID,
  amount_to_add DECIMAL
)
RETURNS void AS $$
BEGIN
  UPDATE campaigns
  SET current_amount = current_amount + amount_to_add,
      updated_at = NOW()
  WHERE id = campaign_id;
END;
$$ LANGUAGE plpgsql;
```

**Usage**:
```typescript
await supabase.rpc('increment_campaign_amount', {
  campaign_id: 'uuid',
  amount_to_add: 1000
})
```

### increment_likes_count / increment_comments_count

Atomically update post engagement metrics.

```sql
CREATE OR REPLACE FUNCTION increment_likes_count(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts
  SET likes_count = likes_count + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;
```

## Database Triggers

### auto_create_user_profile

Automatically create user profile on signup.

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### update_updated_at

Auto-update `updated_at` timestamp.

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Row Level Security (RLS)

All tables have RLS enabled. See [RLS Policies](../security/rls-policies.md) for complete details.

### Key Patterns

**Public Read, Authenticated Write**:
```sql
-- Anyone can read
CREATE POLICY "public_read" ON table_name
  FOR SELECT USING (true);

-- Only authenticated users can write
CREATE POLICY "auth_write" ON table_name
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

**Owner-Only Access**:
```sql
-- Users can only see their own data
CREATE POLICY "owner_only" ON table_name
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);
```

**Role-Based Access**:
```sql
-- Only NGO users can create campaigns
CREATE POLICY "ngo_create" ON campaigns
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ngos
      WHERE ngos.id = campaigns.ngo_id
      AND ngos.user_id = auth.uid()
    )
  );
```

## Performance Optimizations

### Indexes

Strategic indexes on frequently queried columns:

- **Foreign keys**: All foreign key columns indexed
- **Filter columns**: `category`, `status`, `city`
- **Sort columns**: `created_at`, `deadline`
- **Array columns**: GIN indexes on `skills[]`, `hashtags[]`

### Query Optimization

**Use select() sparingly**:
```typescript
// ❌ Fetches all columns (slow)
const { data } = await supabase.from('campaigns').select('*')

// ✅ Only fetch needed columns (fast)
const { data } = await supabase
  .from('campaigns')
  .select('id, title, goal_amount, current_amount')
```

**Use pagination**:
```typescript
const { data } = await supabase
  .from('campaigns')
  .select('*')
  .range(0, 9) // Get first 10 records
```

**Use aggregation**:
```typescript
const { data } = await supabase
  .from('donations')
  .select('amount.sum()')
  .eq('user_id', userId)
```

## Backup and Recovery

Supabase provides automatic backups:
- **Daily backups**: Last 7 days (free tier)
- **Point-in-time recovery**: Available on paid plans
- **Manual backups**: Via pg_dump

## Migrations

Database changes tracked in `supabase/migrations/`:

- `007_corporate_csr_module.sql` - Corporate CSR features
- `008_social_community_layer.sql` - Social features
- `009_phase8_enhancements.sql` - Gamification
- `010_critical_fixes.sql` - Performance fixes
- `011_security_fixes.sql` - Security enhancements
- `012_performance_indexes.sql` - Additional indexes

## Next Steps

- [RLS Policies](../security/rls-policies.md) - Complete security policies
- [API Documentation](../api/overview.md) - How to query the database
- [Backend Architecture](./backend.md) - Services that use the database
