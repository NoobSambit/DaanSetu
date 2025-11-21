-- ====================================
-- Phase 7: Corporate CSR Module
-- ====================================

-- 1. Modify users table to add 'corporate' role
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'ngo', 'admin', 'corporate'));

-- 2. Create corporate_profiles table
CREATE TABLE IF NOT EXISTS corporate_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  industry TEXT NOT NULL,
  company_size TEXT NOT NULL CHECK (company_size IN ('1-50', '51-200', '201-500', '501-1000', '1000+')),
  description TEXT,
  website TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for corporate_profiles table
CREATE INDEX IF NOT EXISTS idx_corporate_profiles_user_id ON corporate_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_corporate_profiles_industry ON corporate_profiles(industry);

-- 3. Create corporate_campaigns table (CSR Campaigns)
CREATE TABLE IF NOT EXISTS corporate_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_id UUID NOT NULL REFERENCES corporate_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  cause TEXT NOT NULL CHECK (cause IN ('education', 'food', 'health', 'disaster', 'women', 'animals', 'environment')),
  goal_amount DECIMAL(10, 2) NOT NULL CHECK (goal_amount > 0),
  current_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for corporate_campaigns table
CREATE INDEX IF NOT EXISTS idx_corporate_campaigns_corporate_id ON corporate_campaigns(corporate_id);
CREATE INDEX IF NOT EXISTS idx_corporate_campaigns_cause ON corporate_campaigns(cause);
CREATE INDEX IF NOT EXISTS idx_corporate_campaigns_status ON corporate_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_corporate_campaigns_deadline ON corporate_campaigns(deadline);
CREATE INDEX IF NOT EXISTS idx_corporate_campaigns_created_at ON corporate_campaigns(created_at);

-- 4. Create partnership_requests table (NGO <-> Corporate partnerships)
CREATE TABLE IF NOT EXISTS partnership_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_campaign_id UUID NOT NULL REFERENCES corporate_campaigns(id) ON DELETE CASCADE,
  ngo_id UUID NOT NULL REFERENCES ngos(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(corporate_campaign_id, ngo_id)
);

-- Create indexes for partnership_requests table
CREATE INDEX IF NOT EXISTS idx_partnership_requests_corporate_campaign_id ON partnership_requests(corporate_campaign_id);
CREATE INDEX IF NOT EXISTS idx_partnership_requests_ngo_id ON partnership_requests(ngo_id);
CREATE INDEX IF NOT EXISTS idx_partnership_requests_status ON partnership_requests(status);

-- 5. Create corporate_employees table
CREATE TABLE IF NOT EXISTS corporate_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_id UUID NOT NULL REFERENCES corporate_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  designation TEXT,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(corporate_id, email)
);

-- Create indexes for corporate_employees table
CREATE INDEX IF NOT EXISTS idx_corporate_employees_corporate_id ON corporate_employees(corporate_id);
CREATE INDEX IF NOT EXISTS idx_corporate_employees_email ON corporate_employees(email);

-- 6. Modify donations table to support corporate campaigns
ALTER TABLE donations ADD COLUMN IF NOT EXISTS corporate_campaign_id UUID REFERENCES corporate_campaigns(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_donations_corporate_campaign_id ON donations(corporate_campaign_id);

-- Enable Row Level Security
ALTER TABLE corporate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE partnership_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_employees ENABLE ROW LEVEL SECURITY;

-- ====================================
-- Row Level Security Policies
-- ====================================

-- Corporate profiles table policies
CREATE POLICY "Anyone can view corporate profiles"
  ON corporate_profiles FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Corporate users can create their own profile"
  ON corporate_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Corporate users can update their own profile"
  ON corporate_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Corporate users can delete their own profile"
  ON corporate_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Corporate campaigns table policies
CREATE POLICY "Anyone can view active corporate campaigns"
  ON corporate_campaigns FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Corporate users can create campaigns"
  ON corporate_campaigns FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM corporate_profiles
      WHERE corporate_profiles.id = corporate_campaigns.corporate_id
      AND corporate_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Corporate users can update their campaigns"
  ON corporate_campaigns FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM corporate_profiles
      WHERE corporate_profiles.id = corporate_campaigns.corporate_id
      AND corporate_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Corporate users can delete their campaigns"
  ON corporate_campaigns FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM corporate_profiles
      WHERE corporate_profiles.id = corporate_campaigns.corporate_id
      AND corporate_profiles.user_id = auth.uid()
    )
  );

-- Partnership requests table policies
CREATE POLICY "NGOs can view partnership requests for their NGO"
  ON partnership_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ngos
      WHERE ngos.id = partnership_requests.ngo_id
      AND ngos.user_id = auth.uid()
    )
  );

CREATE POLICY "Corporates can view partnership requests for their campaigns"
  ON partnership_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM corporate_campaigns cc
      JOIN corporate_profiles cp ON cc.corporate_id = cp.id
      WHERE cc.id = partnership_requests.corporate_campaign_id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "NGOs can create partnership requests"
  ON partnership_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ngos
      WHERE ngos.id = partnership_requests.ngo_id
      AND ngos.user_id = auth.uid()
    )
  );

CREATE POLICY "Corporates can update partnership requests for their campaigns"
  ON partnership_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM corporate_campaigns cc
      JOIN corporate_profiles cp ON cc.corporate_id = cp.id
      WHERE cc.id = partnership_requests.corporate_campaign_id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "NGOs can delete their partnership requests"
  ON partnership_requests FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ngos
      WHERE ngos.id = partnership_requests.ngo_id
      AND ngos.user_id = auth.uid()
    )
  );

-- Corporate employees table policies
CREATE POLICY "Anyone can view corporate employees"
  ON corporate_employees FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Corporate users can manage their employees"
  ON corporate_employees FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM corporate_profiles
      WHERE corporate_profiles.id = corporate_employees.corporate_id
      AND corporate_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Corporate users can update their employees"
  ON corporate_employees FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM corporate_profiles
      WHERE corporate_profiles.id = corporate_employees.corporate_id
      AND corporate_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Corporate users can delete their employees"
  ON corporate_employees FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM corporate_profiles
      WHERE corporate_profiles.id = corporate_employees.corporate_id
      AND corporate_profiles.user_id = auth.uid()
    )
  );
