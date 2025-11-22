-- ====================================
-- Phase 8 Enhancements: Advanced Social Features
-- ====================================

-- 1. Create user_profiles table for extended user information
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  avatar_url TEXT,
  location TEXT,
  website TEXT,
  twitter_handle TEXT,
  linkedin_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- 2. Create follows table (for following users, NGOs, and corporates)
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL,
  following_type TEXT NOT NULL CHECK (following_type IN ('user', 'ngo', 'corporate')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id, following_type)
);

-- Create indexes for follows table
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_type ON follows(following_type);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON follows(created_at DESC);

-- 3. Create post_bookmarks table
CREATE TABLE IF NOT EXISTS post_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Create indexes for post_bookmarks table
CREATE INDEX IF NOT EXISTS idx_post_bookmarks_user_id ON post_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_post_bookmarks_post_id ON post_bookmarks(post_id);
CREATE INDEX IF NOT EXISTS idx_post_bookmarks_created_at ON post_bookmarks(created_at DESC);

-- 4. Create activity_logs table for comprehensive user activity tracking
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'donation', 'volunteer_application', 'post_created', 'post_liked',
    'post_commented', 'campaign_created', 'badge_earned', 'follow'
  )),
  entity_id UUID,
  entity_type TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for activity_logs table
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_activity_type ON activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_id ON activity_logs(entity_id);

-- 5. Add view_count to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Create index for featured posts
CREATE INDEX IF NOT EXISTS idx_posts_is_featured ON posts(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_posts_view_count ON posts(view_count DESC);

-- 6. Create post_views table for tracking unique views
CREATE TABLE IF NOT EXISTS post_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for post_views table
CREATE INDEX IF NOT EXISTS idx_post_views_post_id ON post_views(post_id);
CREATE INDEX IF NOT EXISTS idx_post_views_user_id ON post_views(user_id);
CREATE INDEX IF NOT EXISTS idx_post_views_created_at ON post_views(created_at DESC);

-- 7. Enhance user_badges with tiers
ALTER TABLE user_badges ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum'));
ALTER TABLE user_badges ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;

-- ====================================
-- Row Level Security Policies
-- ====================================

-- Enable RLS on new tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_views ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Anyone can view user profiles"
  ON user_profiles FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can create their own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Follows policies
CREATE POLICY "Anyone can view follows"
  ON follows FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can follow others"
  ON follows FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON follows FOR DELETE
  TO authenticated
  USING (auth.uid() = follower_id);

-- Post bookmarks policies
CREATE POLICY "Users can view their own bookmarks"
  ON post_bookmarks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can bookmark posts"
  ON post_bookmarks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove bookmarks"
  ON post_bookmarks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Activity logs policies
CREATE POLICY "Users can view their own activity logs"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can create activity logs"
  ON activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Post views policies
CREATE POLICY "Anyone can view post views"
  ON post_views FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "System can track post views"
  ON post_views FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- ====================================
-- Helper Functions
-- ====================================

-- Function to get follower count
CREATE OR REPLACE FUNCTION get_follower_count(entity_uuid UUID, entity_type_param TEXT)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM follows
  WHERE following_id = entity_uuid AND following_type = entity_type_param;
$$ LANGUAGE SQL STABLE;

-- Function to get following count for a user
CREATE OR REPLACE FUNCTION get_following_count(user_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM follows
  WHERE follower_id = user_uuid;
$$ LANGUAGE SQL STABLE;

-- Function to check if user is following an entity
CREATE OR REPLACE FUNCTION is_following(user_uuid UUID, entity_uuid UUID, entity_type_param TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1
    FROM follows
    WHERE follower_id = user_uuid
    AND following_id = entity_uuid
    AND following_type = entity_type_param
  );
$$ LANGUAGE SQL STABLE;

-- Function to get trending posts (most engagement in last 7 days)
CREATE OR REPLACE FUNCTION get_trending_posts(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  post_id UUID,
  engagement_score NUMERIC
) AS $$
  SELECT
    p.id AS post_id,
    (
      COALESCE(COUNT(DISTINCT pl.id), 0) * 2 +
      COALESCE(COUNT(DISTINCT pc.id), 0) * 1 +
      COALESCE(p.view_count, 0) * 0.1
    ) AS engagement_score
  FROM posts p
  LEFT JOIN post_likes pl ON pl.post_id = p.id AND pl.created_at > NOW() - INTERVAL '7 days'
  LEFT JOIN post_comments pc ON pc.post_id = p.id AND pc.created_at > NOW() - INTERVAL '7 days'
  WHERE p.created_at > NOW() - INTERVAL '30 days'
  GROUP BY p.id
  ORDER BY engagement_score DESC
  LIMIT limit_count;
$$ LANGUAGE SQL STABLE;

-- Function to get user stats
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS TABLE (
  total_donations NUMERIC,
  donation_count INTEGER,
  volunteer_applications INTEGER,
  posts_created INTEGER,
  comments_made INTEGER,
  badges_earned INTEGER,
  following_count INTEGER,
  follower_count INTEGER
) AS $$
  SELECT
    COALESCE(SUM(d.amount), 0) AS total_donations,
    COALESCE(COUNT(DISTINCT d.id), 0)::INTEGER AS donation_count,
    COALESCE(COUNT(DISTINCT va.id), 0)::INTEGER AS volunteer_applications,
    COALESCE(COUNT(DISTINCT p.id), 0)::INTEGER AS posts_created,
    COALESCE(COUNT(DISTINCT pc.id), 0)::INTEGER AS comments_made,
    COALESCE(COUNT(DISTINCT ub.id), 0)::INTEGER AS badges_earned,
    get_following_count(user_uuid) AS following_count,
    get_follower_count(user_uuid, 'user') AS follower_count
  FROM users u
  LEFT JOIN donations d ON d.user_id = u.id
  LEFT JOIN volunteer_applications va ON va.user_id = u.id
  LEFT JOIN posts p ON p.author_id = u.id
  LEFT JOIN post_comments pc ON pc.user_id = u.id
  LEFT JOIN user_badges ub ON ub.user_id = u.id
  WHERE u.id = user_uuid
  GROUP BY u.id;
$$ LANGUAGE SQL STABLE;

-- Function to increment post view count
CREATE OR REPLACE FUNCTION increment_post_view_count(post_uuid UUID)
RETURNS VOID AS $$
  UPDATE posts
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = post_uuid;
$$ LANGUAGE SQL VOLATILE;
