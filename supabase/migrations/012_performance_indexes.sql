-- ============================================================================
-- Migration 012: Performance Optimization Indexes
-- Adds missing indexes to improve query performance
-- ============================================================================

-- ============================================================================
-- 1. COMPOSITE INDEXES FOR COMMON QUERY PATTERNS
-- ============================================================================

-- Index for user timeline queries (posts by user, ordered by time)
CREATE INDEX IF NOT EXISTS idx_posts_author_created
  ON posts(author_id, created_at DESC);

-- Index for active campaigns with deadlines
CREATE INDEX IF NOT EXISTS idx_campaigns_active_deadline
  ON campaigns(status, deadline DESC)
  WHERE status = 'active';

-- Index for completed donations by campaign
CREATE INDEX IF NOT EXISTS idx_donations_campaign_completed
  ON donations(campaign_id, created_at DESC)
  WHERE payment_status = 'completed';

-- Index for user donations with amounts
CREATE INDEX IF NOT EXISTS idx_donations_user_amount
  ON donations(user_id, amount DESC, created_at DESC)
  WHERE payment_status = 'completed';

-- Index for NGO campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_ngo_status
  ON campaigns(ngo_id, status, created_at DESC);

-- ============================================================================
-- 2. INDEXES FOR JOIN OPERATIONS
-- ============================================================================

-- Index for post likes join
CREATE INDEX IF NOT EXISTS idx_post_likes_post_user
  ON post_likes(post_id, user_id);

-- Index for post comments join
CREATE INDEX IF NOT EXISTS idx_post_comments_post_created
  ON post_comments(post_id, created_at ASC);

-- Index for volunteer applications by opportunity
CREATE INDEX IF NOT EXISTS idx_volunteer_apps_opp_status
  ON volunteer_applications(opportunity_id, status, created_at DESC);

-- Index for volunteer opportunities by NGO
CREATE INDEX IF NOT EXISTS idx_volunteer_opps_ngo_status
  ON volunteer_opportunities(ngo_id, status, date);

-- ============================================================================
-- 3. INDEXES FOR FILTERING AND SEARCH
-- ============================================================================

-- Index for NGO category and city searches
CREATE INDEX IF NOT EXISTS idx_ngos_category_city
  ON ngos(category, city);

-- Index for campaign category and status
CREATE INDEX IF NOT EXISTS idx_campaigns_category_status
  ON campaigns(category, status)
  WHERE status = 'active';

-- Index for posts by category and date
CREATE INDEX IF NOT EXISTS idx_posts_category_created
  ON posts(category, created_at DESC);

-- Index for notifications by user and read status
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created
  ON notifications(user_id, is_read, created_at DESC);

-- ============================================================================
-- 4. INDEXES FOR ANALYTICS QUERIES
-- ============================================================================

-- Index for donation analytics by date range
CREATE INDEX IF NOT EXISTS idx_donations_created_amount
  ON donations(created_at DESC, amount)
  WHERE payment_status = 'completed';

-- Index for campaign analytics
CREATE INDEX IF NOT EXISTS idx_campaigns_created_goal
  ON campaigns(created_at DESC, goal_amount, current_amount);

-- Index for activity logs by user and type
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_type_created
  ON activity_logs(user_id, activity_type, created_at DESC);

-- Index for analytics logs by event type and time
CREATE INDEX IF NOT EXISTS idx_analytics_logs_event_timestamp
  ON analytics_logs(event_type, timestamp DESC);

-- ============================================================================
-- 5. PARTIAL INDEXES FOR SPECIFIC USE CASES
-- ============================================================================

-- Index for unread notifications only
CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON notifications(user_id, created_at DESC)
  WHERE is_read = false;

-- Index for pending volunteer applications
CREATE INDEX IF NOT EXISTS idx_volunteer_apps_pending
  ON volunteer_applications(opportunity_id, created_at DESC)
  WHERE status = 'pending';

-- Index for active volunteer opportunities
CREATE INDEX IF NOT EXISTS idx_volunteer_opps_active
  ON volunteer_opportunities(city, date)
  WHERE status = 'active';

-- Index for recent post-view range queries. The time window belongs in the
-- query because NOW() cannot be used in an immutable index predicate.
CREATE INDEX IF NOT EXISTS idx_post_views_recent
  ON post_views(post_id, created_at DESC);

-- ============================================================================
-- 6. FULL TEXT SEARCH INDEXES (if needed in future)
-- ============================================================================

-- Add tsvector column for NGO search (commented out for now)
-- ALTER TABLE ngos ADD COLUMN IF NOT EXISTS search_vector tsvector;
-- CREATE INDEX IF NOT EXISTS idx_ngos_search ON ngos USING gin(search_vector);

-- Add tsvector column for campaign search (commented out for now)
-- ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS search_vector tsvector;
-- CREATE INDEX IF NOT EXISTS idx_campaigns_search ON campaigns USING gin(search_vector);

-- ============================================================================
-- 7. COVERING INDEXES FOR COMMON QUERIES
-- ============================================================================

-- Covering index for post feed (includes all needed fields)
CREATE INDEX IF NOT EXISTS idx_posts_feed
  ON posts(created_at DESC, id, author_id, title)
  WHERE author_role IN ('ngo', 'corporate');

-- Covering index for donation leaderboard
CREATE INDEX IF NOT EXISTS idx_donations_leaderboard
  ON donations(user_id, amount)
  WHERE payment_status = 'completed';

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON INDEX idx_posts_author_created IS
  'Optimizes queries for user timelines and post history';

COMMENT ON INDEX idx_campaigns_active_deadline IS
  'Optimizes queries for active campaigns with approaching deadlines';

COMMENT ON INDEX idx_donations_campaign_completed IS
  'Optimizes queries for campaign donation history';

COMMENT ON INDEX idx_notifications_unread IS
  'Partial index for faster unread notification queries';

-- ============================================================================
-- ANALYZE TABLES FOR QUERY PLANNER
-- ============================================================================

ANALYZE users;
ANALYZE ngos;
ANALYZE campaigns;
ANALYZE donations;
ANALYZE posts;
ANALYZE post_likes;
ANALYZE post_comments;
ANALYZE notifications;
ANALYZE volunteer_opportunities;
ANALYZE volunteer_applications;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
