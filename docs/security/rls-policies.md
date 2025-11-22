# Row Level Security (RLS) Policies

Complete documentation of all RLS policies in DaanSetu.

## Overview

Row Level Security ensures users can only access data they're authorized to see. Every table in DaanSetu has RLS enabled with specific policies.

**Golden Rule**: If RLS is not enabled, ALL data is accessible to ALL authenticated users!

## Users Table

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view profiles
CREATE POLICY "Users can view all profiles"
  ON users FOR SELECT
  TO authenticated
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);
```

## NGOs Table

```sql
ALTER TABLE ngos ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous) can view NGOs
CREATE POLICY "Anyone can view NGOs"
  ON ngos FOR SELECT
  TO authenticated, anon
  USING (true);

-- Authenticated users can create NGOs
CREATE POLICY "Authenticated users can create NGOs"
  ON ngos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own NGOs
CREATE POLICY "Users can update their own NGOs"
  ON ngos FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own NGOs
CREATE POLICY "Users can delete their own NGOs"
  ON ngos FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

## Campaigns Table

```sql
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Anyone can view active campaigns
CREATE POLICY "Anyone can view active campaigns"
  ON campaigns FOR SELECT
  TO authenticated, anon
  USING (true);

-- NGO users can create campaigns
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

-- NGO users can update their campaigns
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

-- NGO users can delete their campaigns
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
```

## Donations Table

```sql
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- Users can view their own donations
CREATE POLICY "Users can view their own donations"
  ON donations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- NGOs can view donations made to them
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

-- Authenticated users can create donations
CREATE POLICY "Authenticated users can create donations"
  ON donations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

**Note**: Anonymous donations hide donor identity from NGO queries.

## Posts Table

```sql
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Anyone can view posts
CREATE POLICY "Anyone can view posts"
  ON posts FOR SELECT
  TO authenticated, anon
  USING (true);

-- Authenticated users can create posts
CREATE POLICY "Authenticated users can create posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own posts
CREATE POLICY "Users can update their own posts"
  ON posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own posts
CREATE POLICY "Users can delete their own posts"
  ON posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

## Volunteer Profiles

```sql
ALTER TABLE volunteer_profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can view volunteer profiles
CREATE POLICY "Anyone can view volunteer profiles"
  ON volunteer_profiles FOR SELECT
  TO authenticated, anon
  USING (true);

-- Users can create their own volunteer profile
CREATE POLICY "Users can create their own volunteer profile"
  ON volunteer_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON volunteer_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
```

## Testing RLS Policies

### Test Policy Effectiveness

```sql
-- Set context to simulate user
SET request.jwt.claims.sub = 'user-uuid';

-- Try query (should only return user's data)
SELECT * FROM donations;

-- Reset
RESET request.jwt.claims;
```

### Common Mistakes

**❌ Policy too permissive**:
```sql
-- BAD - Returns all data!
CREATE POLICY "view_all" ON donations
  FOR SELECT USING (true);
```

**✅ Correct - User-specific**:
```sql
CREATE POLICY "view_own" ON donations
  FOR SELECT USING (auth.uid() = user_id);
```

### Debugging RLS

If queries return unexpected results:

1. **Check RLS is enabled**:
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

2. **List policies**:
```sql
SELECT * FROM pg_policies
WHERE tablename = 'your_table';
```

3. **Test with specific user**:
```typescript
// In Supabase SQL Editor
SELECT auth.uid(); -- Should return user ID
SELECT * FROM donations; -- Test query
```

## Next Steps

- [Security Overview](./overview.md) - Overall security architecture
- [Best Practices](./best-practices.md) - Security best practices
