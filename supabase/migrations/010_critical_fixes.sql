-- Migration 010: Critical Fixes for Production Readiness
-- This migration addresses critical issues identified in the codebase audit

-- ============================================================================
-- 1. AUTO-CREATE USER PROFILE TRIGGER
-- ============================================================================
-- Automatically create a users table entry when a new auth.users record is created
-- This prevents signup failures when user profile is expected but doesn't exist

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'user',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to auto-create user profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 2. ATOMIC INCREMENT FUNCTIONS (Fix Race Conditions)
-- ============================================================================

-- Atomic increment for campaign amounts
CREATE OR REPLACE FUNCTION public.increment_campaign_amount(
  campaign_id UUID,
  amount_to_add NUMERIC
)
RETURNS VOID AS $$
BEGIN
  UPDATE campaigns
  SET
    current_amount = current_amount + amount_to_add,
    updated_at = NOW()
  WHERE id = campaign_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Campaign not found: %', campaign_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Atomic increment for corporate campaign amounts
CREATE OR REPLACE FUNCTION public.increment_corporate_campaign_amount(
  campaign_id UUID,
  amount_to_add NUMERIC
)
RETURNS VOID AS $$
BEGIN
  UPDATE corporate_campaigns
  SET
    current_amount = current_amount + amount_to_add,
    updated_at = NOW()
  WHERE id = campaign_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Corporate campaign not found: %', campaign_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. ACTIVITY LOGGING FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.log_activity(
  p_user_id UUID,
  p_activity_type TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO activity_logs (
    user_id,
    activity_type,
    entity_type,
    entity_id,
    metadata,
    created_at
  ) VALUES (
    p_user_id,
    p_activity_type,
    p_entity_type,
    p_entity_id,
    p_metadata,
    NOW()
  )
  RETURNING id INTO activity_id;

  RETURN activity_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. PERFORMANCE INDEXES
-- ============================================================================

-- Composite index for common donation queries
CREATE INDEX IF NOT EXISTS idx_donations_user_campaign
  ON donations(user_id, campaign_id)
  WHERE payment_status = 'completed';

-- Index for filtering unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id, is_read, created_at DESC);

-- Index for post views duplicate detection
CREATE INDEX IF NOT EXISTS idx_post_views_unique
  ON post_views(post_id, user_id);

-- Index for campaign status and deadline queries
CREATE INDEX IF NOT EXISTS idx_campaigns_status_deadline
  ON campaigns(status, deadline)
  WHERE status = 'active';

-- Index for posts by user with timestamp
CREATE INDEX IF NOT EXISTS idx_posts_user_created
  ON posts(user_id, created_at DESC);

-- Index for follows relationships
CREATE INDEX IF NOT EXISTS idx_follows_follower_following
  ON follows(follower_id, following_id);

-- Index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_user_stats_points
  ON users(total_donation_amount DESC, created_at);

-- ============================================================================
-- 5. UPDATED_AT TRIGGERS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to tables that have the column
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND column_name = 'updated_at'
    AND table_name NOT LIKE 'pg_%'
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS set_updated_at ON %I;
      CREATE TRIGGER set_updated_at
        BEFORE UPDATE ON %I
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    ', t, t);
  END LOOP;
END $$;

-- ============================================================================
-- 6. OPTIMIZED LEADERBOARD FUNCTION
-- ============================================================================

-- Get user rank efficiently using window functions
CREATE OR REPLACE FUNCTION public.get_user_rank(p_user_id UUID)
RETURNS TABLE(
  rank BIGINT,
  total_users BIGINT,
  percentile NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH ranked_users AS (
    SELECT
      id,
      ROW_NUMBER() OVER (ORDER BY total_donation_amount DESC, created_at ASC) as user_rank
    FROM users
    WHERE total_donation_amount > 0
  ),
  stats AS (
    SELECT COUNT(*) as total FROM ranked_users
  )
  SELECT
    ru.user_rank,
    s.total,
    ROUND((ru.user_rank::NUMERIC / NULLIF(s.total, 0)) * 100, 2) as pct
  FROM ranked_users ru
  CROSS JOIN stats s
  WHERE ru.id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. OPTIMIZED POST STATS AGGREGATION
-- ============================================================================

-- Get aggregated post stats to avoid N+1 queries
CREATE OR REPLACE FUNCTION public.get_posts_with_stats(
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  content TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ,
  like_count BIGINT,
  comment_count BIGINT,
  view_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.user_id,
    p.content,
    p.image_url,
    p.created_at,
    COALESCE(l.like_count, 0) as like_count,
    COALESCE(c.comment_count, 0) as comment_count,
    COALESCE(v.view_count, 0) as view_count
  FROM posts p
  LEFT JOIN (
    SELECT post_id, COUNT(*) as like_count
    FROM post_likes
    GROUP BY post_id
  ) l ON p.id = l.post_id
  LEFT JOIN (
    SELECT post_id, COUNT(*) as comment_count
    FROM post_comments
    GROUP BY post_id
  ) c ON p.id = c.post_id
  LEFT JOIN (
    SELECT post_id, COUNT(*) as view_count
    FROM post_views
    GROUP BY post_id
  ) v ON p.id = v.post_id
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. DATA VALIDATION CONSTRAINTS
-- ============================================================================

-- Ensure donation amounts are positive
ALTER TABLE donations DROP CONSTRAINT IF EXISTS donations_amount_positive;
ALTER TABLE donations ADD CONSTRAINT donations_amount_positive
  CHECK (amount > 0 AND amount <= 100000000);

-- Ensure campaign deadlines are in the future (only for new campaigns)
-- Note: This is checked in application code for updates

-- Ensure goal amounts are positive
ALTER TABLE campaigns DROP CONSTRAINT IF EXISTS campaigns_goal_positive;
ALTER TABLE campaigns ADD CONSTRAINT campaigns_goal_positive
  CHECK (goal_amount > 0);

ALTER TABLE corporate_campaigns DROP CONSTRAINT IF EXISTS corporate_campaigns_goal_positive;
ALTER TABLE corporate_campaigns ADD CONSTRAINT corporate_campaigns_goal_positive
  CHECK (goal_amount > 0);

-- ============================================================================
-- 9. ANALYTICS LOGGING
-- ============================================================================

-- Function to log analytics events
CREATE OR REPLACE FUNCTION public.log_analytics(
  p_user_id UUID,
  p_event_type TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO analytics_logs (
    user_id,
    event_type,
    entity_type,
    entity_id,
    metadata,
    created_at
  ) VALUES (
    p_user_id,
    p_event_type,
    p_entity_type,
    p_entity_id,
    p_metadata,
    NOW()
  )
  RETURNING id INTO log_id;

  RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 10. BATCH VIEW COUNT UPDATE
-- ============================================================================

-- Function to batch update view counts (reduces write contention)
CREATE OR REPLACE FUNCTION public.batch_increment_view_count(
  post_ids UUID[]
)
RETURNS VOID AS $$
BEGIN
  -- This can be called periodically to batch update view counts
  -- For now, it's a placeholder for future optimization
  NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON FUNCTION public.handle_new_user() IS
  'Automatically creates user profile when auth.users record is created';

COMMENT ON FUNCTION public.increment_campaign_amount(UUID, NUMERIC) IS
  'Atomically increments campaign amount to prevent race conditions';

COMMENT ON FUNCTION public.increment_corporate_campaign_amount(UUID, NUMERIC) IS
  'Atomically increments corporate campaign amount to prevent race conditions';

COMMENT ON FUNCTION public.log_activity(UUID, TEXT, TEXT, UUID, JSONB) IS
  'Logs user activity for tracking and analytics';

COMMENT ON FUNCTION public.get_user_rank(UUID) IS
  'Efficiently calculates user rank using window functions';

COMMENT ON FUNCTION public.get_posts_with_stats(INT, INT) IS
  'Returns posts with aggregated stats to avoid N+1 queries';
