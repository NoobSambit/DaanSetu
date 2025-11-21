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

-- Create donations table
CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ngo_id UUID NOT NULL REFERENCES ngos(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  cause TEXT NOT NULL CHECK (cause IN ('education', 'hunger', 'healthcare', 'disaster', 'general')),
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  payment_status TEXT NOT NULL DEFAULT 'completed' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for donations table
CREATE INDEX IF NOT EXISTS idx_donations_user_id ON donations(user_id);
CREATE INDEX IF NOT EXISTS idx_donations_ngo_id ON donations(ngo_id);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON donations(created_at);

-- Enable Row Level Security for donations
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

-- Insert some sample data (optional - for testing)
-- Note: You'll need to replace the user_id with an actual user ID from your auth.users table

-- Example:
-- INSERT INTO ngos (name, description, city, state, category, latitude, longitude, user_id) VALUES
-- ('Education for All', 'Providing free education to underprivileged children in rural areas', 'Mumbai', 'Maharashtra', 'education', 19.0760, 72.8777, 'YOUR_USER_ID_HERE'),
-- ('Food Bank India', 'Fighting hunger by distributing meals to those in need', 'Delhi', 'Delhi', 'food', 28.6139, 77.2090, 'YOUR_USER_ID_HERE'),
-- ('Health First', 'Free medical camps and healthcare services in remote villages', 'Bangalore', 'Karnataka', 'health', 12.9716, 77.5946, 'YOUR_USER_ID_HERE'),
-- ('Women Empowerment Trust', 'Skill development and employment opportunities for women', 'Pune', 'Maharashtra', 'women', 18.5204, 73.8567, 'YOUR_USER_ID_HERE'),
-- ('Animal Rescue Foundation', 'Rescuing and rehabilitating stray and injured animals', 'Chennai', 'Tamil Nadu', 'animals', 13.0827, 80.2707, 'YOUR_USER_ID_HERE');
