-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'ngo', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ngos table
CREATE TABLE IF NOT EXISTS ngos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('education', 'food', 'health', 'women', 'animals')),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ngos_category ON ngos(category);
CREATE INDEX IF NOT EXISTS idx_ngos_city ON ngos(city);
CREATE INDEX IF NOT EXISTS idx_ngos_user_id ON ngos(user_id);
CREATE INDEX IF NOT EXISTS idx_ngos_created_at ON ngos(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ngos ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view all profiles"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- NGOs table policies
CREATE POLICY "Anyone can view NGOs"
  ON ngos FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authenticated users can create NGOs"
  ON ngos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own NGOs"
  ON ngos FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own NGOs"
  ON ngos FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_id UUID NOT NULL REFERENCES ngos(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  short_description TEXT NOT NULL,
  description TEXT NOT NULL,
  goal_amount DECIMAL(10, 2) NOT NULL CHECK (goal_amount > 0),
  current_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  image_url TEXT,
  category TEXT NOT NULL CHECK (category IN ('education', 'food', 'health', 'disaster', 'women', 'animals')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for campaigns table
CREATE INDEX IF NOT EXISTS idx_campaigns_ngo_id ON campaigns(ngo_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_category ON campaigns(category);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_deadline ON campaigns(deadline);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at);

-- Create campaign_updates table
CREATE TABLE IF NOT EXISTS campaign_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for campaign_updates table
CREATE INDEX IF NOT EXISTS idx_campaign_updates_campaign_id ON campaign_updates(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_updates_created_at ON campaign_updates(created_at);

-- Create donations table
CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ngo_id UUID NOT NULL REFERENCES ngos(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  cause TEXT NOT NULL CHECK (cause IN ('education', 'hunger', 'healthcare', 'disaster', 'general')),
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  payment_status TEXT NOT NULL DEFAULT 'completed' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for donations table
CREATE INDEX IF NOT EXISTS idx_donations_user_id ON donations(user_id);
CREATE INDEX IF NOT EXISTS idx_donations_ngo_id ON donations(ngo_id);
CREATE INDEX IF NOT EXISTS idx_donations_campaign_id ON donations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON donations(created_at);

-- Enable Row Level Security
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- Donations table policies
CREATE POLICY "Users can view their own donations"
  ON donations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "NGOs can view donations made to them"
  ON donations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ngos
      WHERE ngos.id = donations.ngo_id
      AND ngos.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create donations"
  ON donations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Campaigns table policies
CREATE POLICY "Anyone can view active campaigns"
  ON campaigns FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "NGO users can create campaigns"
  ON campaigns FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ngos
      WHERE ngos.id = campaigns.ngo_id
      AND ngos.user_id = auth.uid()
    )
  );

CREATE POLICY "NGO users can update their campaigns"
  ON campaigns FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ngos
      WHERE ngos.id = campaigns.ngo_id
      AND ngos.user_id = auth.uid()
    )
  );

CREATE POLICY "NGO users can delete their campaigns"
  ON campaigns FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ngos
      WHERE ngos.id = campaigns.ngo_id
      AND ngos.user_id = auth.uid()
    )
  );

-- Campaign updates table policies
CREATE POLICY "Anyone can view campaign updates"
  ON campaign_updates FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "NGO users can create updates for their campaigns"
  ON campaign_updates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns
      JOIN ngos ON campaigns.ngo_id = ngos.id
      WHERE campaigns.id = campaign_updates.campaign_id
      AND ngos.user_id = auth.uid()
    )
  );

CREATE POLICY "NGO users can delete updates for their campaigns"
  ON campaign_updates FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      JOIN ngos ON campaigns.ngo_id = ngos.id
      WHERE campaigns.id = campaign_updates.campaign_id
      AND ngos.user_id = auth.uid()
    )
  );

-- Insert some sample data (optional - for testing)
-- Note: You'll need to replace the user_id with an actual user ID from your auth.users table

-- Example:
-- INSERT INTO ngos (name, description, city, state, category, latitude, longitude, user_id) VALUES
-- ('Education for All', 'Providing free education to underprivileged children in rural areas', 'Mumbai', 'Maharashtra', 'education', 19.0760, 72.8777, 'YOUR_USER_ID_HERE'),
-- ('Food Bank India', 'Fighting hunger by distributing meals to those in need', 'Delhi', 'Delhi', 'food', 28.6139, 77.2090, 'YOUR_USER_ID_HERE'),
-- ('Health First', 'Free medical camps and healthcare services in remote villages', 'Bangalore', 'Karnataka', 'health', 12.9716, 77.5946, 'YOUR_USER_ID_HERE'),
-- ('Women Empowerment Trust', 'Skill development and employment opportunities for women', 'Pune', 'Maharashtra', 'women', 18.5204, 73.8567, 'YOUR_USER_ID_HERE'),
-- ('Animal Rescue Foundation', 'Rescuing and rehabilitating stray and injured animals', 'Chennai', 'Tamil Nadu', 'animals', 13.0827, 80.2707, 'YOUR_USER_ID_HERE');

-- ====================================
-- Phase 4: Volunteer System
-- ====================================

-- Create volunteer_profiles table
CREATE TABLE IF NOT EXISTS volunteer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  city TEXT NOT NULL,
  skills TEXT[] NOT NULL DEFAULT '{}',
  availability TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for volunteer_profiles table
CREATE INDEX IF NOT EXISTS idx_volunteer_profiles_user_id ON volunteer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_profiles_city ON volunteer_profiles(city);
CREATE INDEX IF NOT EXISTS idx_volunteer_profiles_skills ON volunteer_profiles USING GIN(skills);

-- Create volunteer_opportunities table
CREATE TABLE IF NOT EXISTS volunteer_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_id UUID NOT NULL REFERENCES ngos(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  city TEXT NOT NULL,
  required_skills TEXT[] NOT NULL DEFAULT '{}',
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  total_needed INTEGER NOT NULL CHECK (total_needed > 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for volunteer_opportunities table
CREATE INDEX IF NOT EXISTS idx_volunteer_opportunities_ngo_id ON volunteer_opportunities(ngo_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_opportunities_city ON volunteer_opportunities(city);
CREATE INDEX IF NOT EXISTS idx_volunteer_opportunities_date ON volunteer_opportunities(date);
CREATE INDEX IF NOT EXISTS idx_volunteer_opportunities_status ON volunteer_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_volunteer_opportunities_skills ON volunteer_opportunities USING GIN(required_skills);

-- Create volunteer_applications table
CREATE TABLE IF NOT EXISTS volunteer_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES volunteer_opportunities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(opportunity_id, user_id)
);

-- Create indexes for volunteer_applications table
CREATE INDEX IF NOT EXISTS idx_volunteer_applications_opportunity_id ON volunteer_applications(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_applications_user_id ON volunteer_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_applications_status ON volunteer_applications(status);

-- Enable Row Level Security
ALTER TABLE volunteer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_applications ENABLE ROW LEVEL SECURITY;

-- Volunteer profiles table policies
CREATE POLICY "Anyone can view volunteer profiles"
  ON volunteer_profiles FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can create their own volunteer profile"
  ON volunteer_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own volunteer profile"
  ON volunteer_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own volunteer profile"
  ON volunteer_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Volunteer opportunities table policies
CREATE POLICY "Anyone can view active volunteer opportunities"
  ON volunteer_opportunities FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "NGO users can create volunteer opportunities"
  ON volunteer_opportunities FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ngos
      WHERE ngos.id = volunteer_opportunities.ngo_id
      AND ngos.user_id = auth.uid()
    )
  );

CREATE POLICY "NGO users can update their volunteer opportunities"
  ON volunteer_opportunities FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ngos
      WHERE ngos.id = volunteer_opportunities.ngo_id
      AND ngos.user_id = auth.uid()
    )
  );

CREATE POLICY "NGO users can delete their volunteer opportunities"
  ON volunteer_opportunities FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ngos
      WHERE ngos.id = volunteer_opportunities.ngo_id
      AND ngos.user_id = auth.uid()
    )
  );

-- Volunteer applications table policies
CREATE POLICY "Users can view their own applications"
  ON volunteer_applications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "NGO users can view applications for their opportunities"
  ON volunteer_applications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM volunteer_opportunities vo
      JOIN ngos ON vo.ngo_id = ngos.id
      WHERE vo.id = volunteer_applications.opportunity_id
      AND ngos.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create applications"
  ON volunteer_applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "NGO users can update applications for their opportunities"
  ON volunteer_applications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM volunteer_opportunities vo
      JOIN ngos ON vo.ngo_id = ngos.id
      WHERE vo.id = volunteer_applications.opportunity_id
      AND ngos.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own applications"
  ON volunteer_applications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ====================================
-- Phase 5: AI Recommendation System
-- ====================================

-- Create ai_flags table for AI quality flagging
CREATE TABLE IF NOT EXISTS ai_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('ngo', 'campaign')),
  entity_id UUID NOT NULL,
  reason TEXT NOT NULL,
  confidence TEXT NOT NULL DEFAULT 'medium' CHECK (confidence IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for ai_flags table
CREATE INDEX IF NOT EXISTS idx_ai_flags_entity_type ON ai_flags(entity_type);
CREATE INDEX IF NOT EXISTS idx_ai_flags_entity_id ON ai_flags(entity_id);
CREATE INDEX IF NOT EXISTS idx_ai_flags_created_at ON ai_flags(created_at);

-- Enable Row Level Security
ALTER TABLE ai_flags ENABLE ROW LEVEL SECURITY;

-- AI flags table policies
CREATE POLICY "Admin users can view all AI flags"
  ON ai_flags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "System can create AI flags"
  ON ai_flags FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin users can delete AI flags"
  ON ai_flags FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- ====================================
-- Phase 6: Analytics & Transparency Layer
-- ====================================

-- Create analytics_logs table for time-series analytics
CREATE TABLE IF NOT EXISTS analytics_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('donation_created', 'campaign_created', 'volunteer_applied')),
  related_id UUID NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for analytics_logs table
CREATE INDEX IF NOT EXISTS idx_analytics_logs_event_type ON analytics_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_logs_related_id ON analytics_logs(related_id);
CREATE INDEX IF NOT EXISTS idx_analytics_logs_timestamp ON analytics_logs(timestamp);

-- Enable Row Level Security
ALTER TABLE analytics_logs ENABLE ROW LEVEL SECURITY;

-- Analytics logs table policies
CREATE POLICY "Anyone can view analytics logs"
  ON analytics_logs FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "System can create analytics logs"
  ON analytics_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);
