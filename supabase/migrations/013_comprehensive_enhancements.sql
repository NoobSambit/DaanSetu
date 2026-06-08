-- ============================================================================
-- DaanSetu Comprehensive Enhancement Migration
-- ============================================================================
-- This migration adds extensive new features across all platform modules
-- Date: 2025-11-22
-- Version: 013

-- ============================================================================
-- 1. NGO ENHANCEMENTS
-- ============================================================================

-- NGO Verification System
CREATE TABLE IF NOT EXISTS ngo_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_id UUID NOT NULL REFERENCES ngos(id) ON DELETE CASCADE,
  verification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verified_by UUID REFERENCES users(id),
  verification_date TIMESTAMP WITH TIME ZONE,
  verification_notes TEXT,
  documents_verified BOOLEAN DEFAULT false,
  registration_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ngo_verifications_ngo_id ON ngo_verifications(ngo_id);
CREATE INDEX idx_ngo_verifications_status ON ngo_verifications(verification_status);

-- NGO Ratings and Reviews
CREATE TABLE IF NOT EXISTS ngo_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_id UUID NOT NULL REFERENCES ngos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  donation_id UUID REFERENCES donations(id),
  is_verified_donor BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ngo_id, user_id)
);

CREATE INDEX idx_ngo_reviews_ngo_id ON ngo_reviews(ngo_id);
CREATE INDEX idx_ngo_reviews_rating ON ngo_reviews(rating);
CREATE INDEX idx_ngo_reviews_created_at ON ngo_reviews(created_at DESC);

-- Add average rating to NGOs table
ALTER TABLE ngos ADD COLUMN IF NOT EXISTS average_rating DECIMAL(2,1) DEFAULT 0;
ALTER TABLE ngos ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;
ALTER TABLE ngos ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- ============================================================================
-- 2. DONATION ENHANCEMENTS
-- ============================================================================

-- Recurring Donations
CREATE TABLE IF NOT EXISTS recurring_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ngo_id UUID NOT NULL REFERENCES ngos(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  cause TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  next_donation_date DATE NOT NULL,
  last_donation_date DATE,
  total_donations_made INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_recurring_donations_user_id ON recurring_donations(user_id);
CREATE INDEX idx_recurring_donations_next_date ON recurring_donations(next_donation_date);
CREATE INDEX idx_recurring_donations_status ON recurring_donations(status);

-- Tax Receipts
CREATE TABLE IF NOT EXISTS tax_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ngo_id UUID NOT NULL REFERENCES ngos(id) ON DELETE CASCADE,
  receipt_number TEXT NOT NULL UNIQUE,
  financial_year TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  tax_exemption_80g BOOLEAN DEFAULT true,
  pdf_url TEXT,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(donation_id)
);

CREATE INDEX idx_tax_receipts_user_id ON tax_receipts(user_id);
CREATE INDEX idx_tax_receipts_financial_year ON tax_receipts(financial_year);

-- Donation Gift Cards
CREATE TABLE IF NOT EXISTS donation_gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  purchased_by UUID REFERENCES users(id),
  recipient_email TEXT,
  recipient_name TEXT,
  message TEXT,
  redeemed_by UUID REFERENCES users(id),
  redeemed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_gift_cards_code ON donation_gift_cards(code);
CREATE INDEX idx_gift_cards_status ON donation_gift_cards(status);

-- Add payment method tracking to donations
ALTER TABLE donations ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'razorpay';
ALTER TABLE donations ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS recurring_donation_id UUID REFERENCES recurring_donations(id);

-- ============================================================================
-- 3. CAMPAIGN ENHANCEMENTS
-- ============================================================================

-- Campaign Templates
CREATE TABLE IF NOT EXISTS campaign_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  template_category TEXT NOT NULL,
  default_goal_amount DECIMAL(10, 2),
  default_duration_days INTEGER,
  suggested_content TEXT,
  image_url TEXT,
  created_by UUID REFERENCES users(id),
  is_public BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_campaign_templates_category ON campaign_templates(template_category);

-- Campaign Milestones
CREATE TABLE IF NOT EXISTS campaign_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_amount DECIMAL(10, 2) NOT NULL,
  reward_description TEXT,
  achieved BOOLEAN DEFAULT false,
  achieved_at TIMESTAMP WITH TIME ZONE,
  milestone_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_campaign_milestones_campaign_id ON campaign_milestones(campaign_id);
CREATE INDEX idx_campaign_milestones_order ON campaign_milestones(campaign_id, milestone_order);

-- Campaign Collaborators (Multi-NGO Campaigns)
CREATE TABLE IF NOT EXISTS campaign_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  ngo_id UUID NOT NULL REFERENCES ngos(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'partner', 'beneficiary')),
  funding_percentage DECIMAL(5, 2),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(campaign_id, ngo_id)
);

CREATE INDEX idx_campaign_collaborators_campaign_id ON campaign_collaborators(campaign_id);

-- Add video support to campaigns
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES campaign_templates(id);

-- ============================================================================
-- 4. VOLUNTEER ENHANCEMENTS
-- ============================================================================

-- Volunteer Certificates
CREATE TABLE IF NOT EXISTS volunteer_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES volunteer_opportunities(id) ON DELETE CASCADE,
  ngo_id UUID NOT NULL REFERENCES ngos(id) ON DELETE CASCADE,
  certificate_number TEXT NOT NULL UNIQUE,
  hours_completed DECIMAL(5, 2) NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  pdf_url TEXT,
  verified_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, opportunity_id)
);

CREATE INDEX idx_volunteer_certificates_user_id ON volunteer_certificates(user_id);

-- Volunteer Hours Tracking
CREATE TABLE IF NOT EXISTS volunteer_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES volunteer_opportunities(id) ON DELETE CASCADE,
  ngo_id UUID NOT NULL REFERENCES ngos(id) ON DELETE CASCADE,
  hours DECIMAL(5, 2) NOT NULL CHECK (hours > 0),
  date DATE NOT NULL,
  description TEXT,
  verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_volunteer_hours_user_id ON volunteer_hours(user_id);
CREATE INDEX idx_volunteer_hours_date ON volunteer_hours(date DESC);

-- Skill Verifications
CREATE TABLE IF NOT EXISTS skill_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill TEXT NOT NULL,
  verified_by UUID REFERENCES users(id),
  verification_type TEXT NOT NULL CHECK (verification_type IN ('ngo_endorsement', 'certificate', 'peer_review')),
  evidence_url TEXT,
  verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, skill, verified_by)
);

CREATE INDEX idx_skill_verifications_user_id ON skill_verifications(user_id);

-- Add total volunteer hours to user profiles
ALTER TABLE volunteer_profiles ADD COLUMN IF NOT EXISTS total_hours DECIMAL(7, 2) DEFAULT 0;
ALTER TABLE volunteer_profiles ADD COLUMN IF NOT EXISTS verified_skills TEXT[] DEFAULT '{}';

-- ============================================================================
-- 5. SOCIAL & COMMUNITY ENHANCEMENTS
-- ============================================================================

-- Stories (24-hour ephemeral content)
CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_role TEXT NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  caption TEXT,
  link_url TEXT,
  view_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_stories_user_id ON stories(user_id);
CREATE INDEX idx_stories_expires_at ON stories(expires_at);
CREATE INDEX idx_stories_created_at ON stories(created_at DESC);

-- Story Views
CREATE TABLE IF NOT EXISTS story_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(story_id, viewer_id)
);

CREATE INDEX idx_story_views_story_id ON story_views(story_id);

-- Polls
CREATE TABLE IF NOT EXISTS polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  total_votes INTEGER DEFAULT 0,
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_polls_post_id ON polls(post_id);

-- Poll Options
CREATE TABLE IF NOT EXISTS poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  vote_count INTEGER DEFAULT 0,
  option_order INTEGER NOT NULL
);

CREATE INDEX idx_poll_options_poll_id ON poll_options(poll_id);

-- Poll Votes
CREATE TABLE IF NOT EXISTS poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);

CREATE INDEX idx_poll_votes_poll_id ON poll_votes(poll_id);

-- Events
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  creator_role TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('fundraiser', 'volunteer_drive', 'awareness', 'workshop', 'other')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  is_virtual BOOLEAN DEFAULT false,
  virtual_link TEXT,
  max_attendees INTEGER,
  current_attendees INTEGER DEFAULT 0,
  image_url TEXT,
  ngo_id UUID REFERENCES ngos(id),
  campaign_id UUID REFERENCES campaigns(id),
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_creator ON events(created_by);
CREATE INDEX idx_events_status ON events(status);

-- Event RSVPs
CREATE TABLE IF NOT EXISTS event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'going' CHECK (status IN ('going', 'interested', 'not_going')),
  rsvp_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  attended BOOLEAN DEFAULT false,
  UNIQUE(event_id, user_id)
);

CREATE INDEX idx_event_rsvps_event_id ON event_rsvps(event_id);
CREATE INDEX idx_event_rsvps_user_id ON event_rsvps(user_id);

-- ============================================================================
-- 6. ANALYTICS & REPORTING ENHANCEMENTS
-- ============================================================================

-- Custom Reports
CREATE TABLE IF NOT EXISTS custom_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_name TEXT NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('donations', 'campaigns', 'volunteers', 'impact', 'custom')),
  filters JSONB NOT NULL DEFAULT '{}',
  date_range_start DATE,
  date_range_end DATE,
  generated_data JSONB,
  pdf_url TEXT,
  excel_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_generated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_custom_reports_user_id ON custom_reports(created_by);

-- Predictive Analytics Data
CREATE TABLE IF NOT EXISTS predictive_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('campaign', 'ngo', 'user')),
  entity_id UUID NOT NULL,
  prediction_type TEXT NOT NULL CHECK (prediction_type IN ('success_probability', 'donor_retention', 'completion_date', 'funding_forecast')),
  prediction_value DECIMAL(10, 2),
  confidence_score DECIMAL(3, 2),
  factors JSONB,
  predicted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_predictive_analytics_entity ON predictive_analytics(entity_type, entity_id);

-- ============================================================================
-- 7. PLATFORM-WIDE ENHANCEMENTS
-- ============================================================================

-- Email Notification Queue
CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  text_body TEXT,
  template_id TEXT,
  metadata JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_email_queue_status ON email_queue(status);
CREATE INDEX idx_email_queue_created_at ON email_queue(created_at);

-- SMS Notification Queue
CREATE TABLE IF NOT EXISTS sms_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_phone TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  attempts INTEGER DEFAULT 0,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sms_queue_status ON sms_queue(status);

-- Translations for i18n
CREATE TABLE IF NOT EXISTS translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('en', 'hi', 'bn', 'te', 'ta', 'mr', 'gu', 'kn', 'ml', 'pa')),
  value TEXT NOT NULL,
  context TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(key, language)
);

CREATE INDEX idx_translations_language ON translations(language);

-- Full-Text Search Configuration
CREATE TABLE IF NOT EXISTS search_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('ngo', 'campaign', 'post', 'event')),
  entity_id UUID NOT NULL,
  title TEXT,
  description TEXT,
  searchable_text TSVECTOR,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(entity_type, entity_id)
);

CREATE INDEX idx_search_index_entity ON search_index(entity_type, entity_id);
CREATE INDEX idx_search_fulltext ON search_index USING GIN(searchable_text);

-- ============================================================================
-- 8. ADMIN & MODERATION ENHANCEMENTS
-- ============================================================================

-- Content Reports
CREATE TABLE IF NOT EXISTS content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('post', 'comment', 'ngo', 'campaign', 'user')),
  entity_id UUID NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'inappropriate', 'fraud', 'harassment', 'other')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES users(id),
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_content_reports_status ON content_reports(status);
CREATE INDEX idx_content_reports_entity ON content_reports(entity_type, entity_id);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Platform Settings
CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  category TEXT,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Update NGO average rating
CREATE OR REPLACE FUNCTION update_ngo_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ngos
  SET average_rating = (
    SELECT ROUND(AVG(rating)::numeric, 1)
    FROM ngo_reviews
    WHERE ngo_id = NEW.ngo_id
  ),
  total_reviews = (
    SELECT COUNT(*)
    FROM ngo_reviews
    WHERE ngo_id = NEW.ngo_id
  )
  WHERE id = NEW.ngo_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ngo_rating
AFTER INSERT OR UPDATE OR DELETE ON ngo_reviews
FOR EACH ROW EXECUTE FUNCTION update_ngo_rating();

-- Auto-expire stories after 24 hours (cleanup function)
CREATE OR REPLACE FUNCTION cleanup_expired_stories()
RETURNS void AS $$
BEGIN
  DELETE FROM stories WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Update volunteer total hours
CREATE OR REPLACE FUNCTION update_volunteer_hours()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE volunteer_profiles
  SET total_hours = (
    SELECT COALESCE(SUM(hours), 0)
    FROM volunteer_hours
    WHERE user_id = NEW.user_id AND verified = true
  )
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_volunteer_hours
AFTER INSERT OR UPDATE ON volunteer_hours
FOR EACH ROW EXECUTE FUNCTION update_volunteer_hours();

-- Update event attendee count
CREATE OR REPLACE FUNCTION update_event_attendees()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE events
  SET current_attendees = (
    SELECT COUNT(*)
    FROM event_rsvps
    WHERE event_id = NEW.event_id AND status = 'going'
  )
  WHERE id = NEW.event_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_event_attendees
AFTER INSERT OR UPDATE OR DELETE ON event_rsvps
FOR EACH ROW EXECUTE FUNCTION update_event_attendees();

-- Generate tax receipt number
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.receipt_number := 'TR-' || TO_CHAR(NEW.generated_at, 'YYYYMMDD') || '-' || SUBSTRING(NEW.id::text FROM 1 FOR 8);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_receipt_number
BEFORE INSERT ON tax_receipts
FOR EACH ROW EXECUTE FUNCTION generate_receipt_number();

-- Full-text search update function
CREATE OR REPLACE FUNCTION update_search_index()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO search_index (entity_type, entity_id, title, description, searchable_text)
  VALUES (
    TG_ARGV[0],
    NEW.id,
    COALESCE(NEW.title, NEW.name),
    NEW.description,
    to_tsvector('english', COALESCE(NEW.title, NEW.name, '') || ' ' || COALESCE(NEW.description, ''))
  )
  ON CONFLICT (entity_type, entity_id)
  DO UPDATE SET
    title = COALESCE(NEW.title, NEW.name),
    description = NEW.description,
    searchable_text = to_tsvector('english', COALESCE(NEW.title, NEW.name, '') || ' ' || COALESCE(NEW.description, '')),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- NGO Verifications (Admin only can verify)
ALTER TABLE ngo_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_verifications" ON ngo_verifications FOR SELECT USING (true);
CREATE POLICY "ngo_owners_insert" ON ngo_verifications FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM ngos WHERE ngos.id = ngo_id AND ngos.user_id = auth.uid()));

-- NGO Reviews (Anyone can read, donors can write)
ALTER TABLE ngo_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_reviews" ON ngo_reviews FOR SELECT USING (true);
CREATE POLICY "donors_write_reviews" ON ngo_reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_update_own_reviews" ON ngo_reviews FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Recurring Donations
ALTER TABLE recurring_donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_manage_own_recurring" ON recurring_donations FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- Tax Receipts
ALTER TABLE tax_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_view_own_receipts" ON tax_receipts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Events (Public read, authenticated write)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_events" ON events FOR SELECT USING (true);
CREATE POLICY "authenticated_create_events" ON events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);
CREATE POLICY "creators_update_events" ON events FOR UPDATE TO authenticated
  USING (auth.uid() = created_by);

-- Event RSVPs
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_manage_own_rsvps" ON event_rsvps FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- Stories
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_active_stories" ON stories FOR SELECT
  USING (expires_at > NOW());
CREATE POLICY "users_create_stories" ON stories FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_delete_own_stories" ON stories FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Polls
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_polls" ON polls FOR SELECT USING (true);
CREATE POLICY "users_create_polls" ON polls FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Poll Votes
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_vote_once" ON poll_votes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Volunteer Certificates
ALTER TABLE volunteer_certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_certificates" ON volunteer_certificates FOR SELECT USING (true);

-- Volunteer Hours
ALTER TABLE volunteer_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_view_own_hours" ON volunteer_hours FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "users_log_hours" ON volunteer_hours FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Content Reports (Users can create, admins can manage)
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_create_reports" ON content_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reported_by);

-- Audit Logs (Admin read only)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_read_audit_logs" ON audit_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- Email Queue (System only)
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Composite indexes for common queries
CREATE INDEX idx_ngo_reviews_verified_rating ON ngo_reviews(ngo_id, is_verified_donor, rating DESC);
CREATE INDEX idx_recurring_active_next_date ON recurring_donations(status, next_donation_date) WHERE status = 'active';
CREATE INDEX idx_events_upcoming ON events(start_date, status) WHERE status = 'upcoming';
CREATE INDEX idx_stories_active ON stories(expires_at, created_at DESC);

-- ============================================================================
-- DEFAULT DATA
-- ============================================================================

-- Insert default platform settings
INSERT INTO platform_settings (key, value, description, category) VALUES
  ('maintenance_mode', 'false', 'Enable maintenance mode', 'system'),
  ('allow_registrations', 'true', 'Allow new user registrations', 'system'),
  ('min_donation_amount', '10', 'Minimum donation amount in INR', 'donations'),
  ('max_donation_amount', '10000000', 'Maximum donation amount in INR', 'donations'),
  ('enable_recurring_donations', 'true', 'Enable recurring donations feature', 'donations'),
  ('enable_gift_cards', 'true', 'Enable donation gift cards', 'donations'),
  ('enable_stories', 'true', 'Enable 24-hour stories feature', 'social'),
  ('enable_events', 'true', 'Enable events and RSVP', 'social'),
  ('enable_polls', 'true', 'Enable polls in posts', 'social'),
  ('ngo_verification_required', 'false', 'Require NGO verification before campaigns', 'verification'),
  ('email_notifications_enabled', 'true', 'Enable email notifications', 'notifications'),
  ('sms_notifications_enabled', 'false', 'Enable SMS notifications', 'notifications')
ON CONFLICT (key) DO NOTHING;

-- Insert default campaign templates
INSERT INTO campaign_templates (name, description, template_category, default_goal_amount, default_duration_days, suggested_content) VALUES
  ('Education for Underprivileged', 'Support education for children from low-income families', 'education', 100000, 60, 'Help us provide quality education to children who cannot afford it. Your contribution will cover school fees, books, and learning materials.'),
  ('Medical Emergency Fund', 'Help individuals facing medical emergencies', 'health', 500000, 30, 'Support patients who need urgent medical treatment but cannot afford it. Every contribution saves a life.'),
  ('Food Distribution Drive', 'Provide nutritious meals to the hungry', 'food', 50000, 45, 'Help us feed the underprivileged in our community. Your donation will provide nutritious meals to families in need.'),
  ('Disaster Relief Fund', 'Support communities affected by natural disasters', 'disaster', 1000000, 90, 'Help rebuild lives affected by natural calamities. Your support provides shelter, food, and medical aid to disaster victims.'),
  ('Women Empowerment Program', 'Enable financial independence for women', 'women', 200000, 120, 'Support skill development and entrepreneurship programs for women. Help them achieve financial independence and dignity.'),
  ('Animal Rescue & Care', 'Rescue and rehabilitation of stray animals', 'animals', 75000, 60, 'Help us provide medical care, shelter, and food for rescued animals. Your donation gives them a second chance at life.')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON SCHEMA public IS 'DaanSetu comprehensive enhancements migration 013 completed';
