# Documents, Storage, and Tax Records

DaanSetu stores several kinds of files. Some are public assets, and some are private sensitive documents.

## Public Buckets

Public assets include:

- NGO logos.
- NGO covers.
- Public gallery images.
- Public community images.

These assets can be displayed directly when the record is public.

## Private Buckets

Private assets include:

- NGO verification documents.
- Campaign evidence.
- Tax certificates.

Private files must be served through authenticated, ownership-aware routes.

## Main Routes

- `/api/ngo/profile-assets`
- `/api/ngo/verification-documents`
- `/api/ngo/verification-documents/[id]`
- `/api/campaign-evidence/[campaignId]/[index]`
- `/api/tax-certificates/[id]`
- `/api/receipts/[id]`
- `/api/upload/image`
- `/ngo/dashboard/tax`
- `/ngo/dashboard/tax/10bd`

## File Validation

`lib/storage/file-validation.ts` validates private documents. Private documents should reject unsupported file types and oversized files.

## Encryption

Sensitive document bytes use encryption helpers in `lib/security/encryption.ts`.

The environment variable `FILE_ENCRYPTION_KEY` must be a base64-encoded 32-byte key.

Encrypted documents are stored with authenticated context so a file cannot be silently moved into another meaning.

## Tax Records

Important tax tables:

- `donor_tax_profiles`
- `tax_certificates`

Supporters can maintain tax profile details. NGOs can upload official Form 10BE mappings.

Important distinction:

- Donation receipt: app-generated proof of a donation record.
- Form 10BE: official statutory certificate document.
- Form 10BD: filing/export workflow for NGO-side compliance.

The app should not pretend that a normal receipt is an official statutory certificate.

