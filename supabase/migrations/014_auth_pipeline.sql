-- Migration 014: secure authentication and profile provisioning

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('user', 'ngo', 'corporate', 'admin'));

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Users can view limited profile information" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view profiles" ON public.users;

CREATE POLICY "Users can view profiles"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (true);

-- Profiles are provisioned by the auth trigger. Clients cannot create, delete,
-- or change the authorization-bearing role column directly.
REVOKE ALL ON public.users FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  requested_role TEXT;
BEGIN
  requested_role := CASE
    WHEN NEW.raw_user_meta_data->>'account_type' IN ('user', 'ngo', 'corporate')
      THEN NEW.raw_user_meta_data->>'account_type'
    ELSE 'user'
  END;

  INSERT INTO public.users (id, email, name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(
      NULLIF(BTRIM(NEW.raw_user_meta_data->>'name'), ''),
      split_part(COALESCE(NEW.email, 'member'), '@', 1)
    ),
    requested_role,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE OF email, raw_user_meta_data ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Repair profiles for auth identities created before this migration.
INSERT INTO public.users (id, email, name, role, created_at, updated_at)
SELECT
  au.id,
  COALESCE(au.email, ''),
  COALESCE(
    NULLIF(BTRIM(au.raw_user_meta_data->>'name'), ''),
    split_part(COALESCE(au.email, 'member'), '@', 1)
  ),
  CASE
    WHEN au.raw_user_meta_data->>'account_type' IN ('user', 'ngo', 'corporate')
      THEN au.raw_user_meta_data->>'account_type'
    ELSE 'user'
  END,
  COALESCE(au.created_at, NOW()),
  NOW()
FROM auth.users au
ON CONFLICT (id) DO NOTHING;

GRANT SELECT ON public.users TO authenticated;
