# Document and Storage APIs

```mermaid
flowchart TD
  Upload[Upload request] --> PublicImage[/api/upload/image/]
  Upload --> NGOAssets[/api/ngo/profile-assets/]
  Upload --> PrivateDocs[/api/ngo/verification-documents/]
  PrivateDocs --> Encrypt[Encrypt private bytes]
  Encrypt --> PrivateBucket[Private bucket]
  PublicImage --> PublicBucket[Public media bucket]
  NGOAssets --> PublicBucket
  PrivateBucket --> Download[Authorized download routes]
  Download --> Tax[/api/tax-certificates/id/]
  Download --> Evidence[/api/campaign-evidence/campaignId/index/]
  Download --> Verification[/api/ngo/verification-documents/id/]
```

## `/api/upload/image`

Uploads community media to the fixed `community-media` bucket.

## `/api/ngo/profile-assets`

Handles NGO profile asset uploads such as logo and cover.

## `/api/ngo/verification-documents`

Handles private NGO verification document upload and deletion.

## `/api/ngo/verification-documents/[id]`

Serves a private NGO verification document to authorized users.

## `/api/campaign-evidence/[campaignId]/[index]`

Serves private campaign evidence to authorized users, usually admins or owners.

## `/api/tax-certificates/[id]`

Serves private tax certificate documents to authorized users.

## `/api/receipts/[id]`

Serves an app-level donation receipt to the allowed donor or admin.

## `/api/volunteer-certificates/[id]`

Returns a volunteer certificate PDF for an authorized participant.
