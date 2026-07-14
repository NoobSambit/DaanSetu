-- Migration 027: mark application-encrypted private storage objects.

ALTER TABLE public.ngo_verification_documents
  ADD COLUMN IF NOT EXISTS encryption_version INTEGER,
  ADD COLUMN IF NOT EXISTS encrypted_at TIMESTAMPTZ;
ALTER TABLE public.ngo_verification_documents
  DROP CONSTRAINT IF EXISTS ngo_verification_documents_encryption_version_check,
  ADD CONSTRAINT ngo_verification_documents_encryption_version_check
    CHECK (encryption_version IN (1));

ALTER TABLE public.tax_certificates
  ADD COLUMN IF NOT EXISTS encryption_version INTEGER,
  ADD COLUMN IF NOT EXISTS encrypted_at TIMESTAMPTZ;
ALTER TABLE public.tax_certificates
  DROP CONSTRAINT IF EXISTS tax_certificates_encryption_version_check,
  ADD CONSTRAINT tax_certificates_encryption_version_check
    CHECK (encryption_version IN (1));
