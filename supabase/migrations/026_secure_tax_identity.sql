-- Migration 026: encrypted donor identity records for statutory preparation.

CREATE TABLE IF NOT EXISTS public.donor_tax_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  id_code TEXT NOT NULL CHECK (
    id_code IN ('PAN', 'AADHAAR', 'PASSPORT', 'VOTER_ID', 'FOREIGN_TIN')
  ),
  identifier_ciphertext TEXT NOT NULL CHECK (identifier_ciphertext LIKE 'v1.%'),
  address_ciphertext TEXT NOT NULL CHECK (address_ciphertext LIKE 'v1.%'),
  consented_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.donor_tax_profiles ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.donor_tax_profiles FROM anon;
REVOKE ALL ON TABLE public.donor_tax_profiles FROM authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.donor_tax_profiles TO authenticated;

CREATE POLICY "Donors read own tax profile"
  ON public.donor_tax_profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Donors create own tax profile"
  ON public.donor_tax_profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Donors update own tax profile"
  ON public.donor_tax_profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.audit_donor_tax_profile_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    changes
  ) VALUES (
    auth.uid(),
    CASE WHEN TG_OP = 'INSERT'
      THEN 'donor_tax_profile.created'
      ELSE 'donor_tax_profile.updated'
    END,
    'donor_tax_profile',
    NEW.user_id,
    jsonb_build_object('id_code', NEW.id_code)
  );
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.audit_donor_tax_profile_change() FROM PUBLIC;

DROP TRIGGER IF EXISTS donor_tax_profile_audit
  ON public.donor_tax_profiles;
CREATE TRIGGER donor_tax_profile_audit
AFTER INSERT OR UPDATE ON public.donor_tax_profiles
FOR EACH ROW EXECUTE FUNCTION public.audit_donor_tax_profile_change();

DROP TRIGGER IF EXISTS donor_tax_profiles_updated_at
  ON public.donor_tax_profiles;
CREATE TRIGGER donor_tax_profiles_updated_at
BEFORE UPDATE ON public.donor_tax_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
