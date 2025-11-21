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
