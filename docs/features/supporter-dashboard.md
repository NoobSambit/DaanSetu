# Supporter Dashboard

The supporter dashboard gives normal users a place to track their giving, impact, saved content, profile, and account security.

## Routes

- `/dashboard`
- `/dashboard/activity`
- `/dashboard/bookmarks`
- `/dashboard/giving`
- `/dashboard/impact`
- `/dashboard/profile/edit`
- `/dashboard/security`

## Dashboard Summary

`/dashboard` shows a supporter-focused summary. It reads donations and computes user-facing totals using net amounts, which means refunds reduce totals.

## Giving

`/dashboard/giving` shows:

- Donation history.
- Subscription records.
- Refund requests.
- Donor tax profile form.
- Receipt download links.
- Financial-year route support.

The financial-year route is:

- `/dashboard/giving/financial-year`

## Tax Profile

Supporters can save donor tax details through `/dashboard/giving/tax-profile/actions.ts`.

Sensitive donor tax data is stored in `donor_tax_profiles`. Database triggers and security code protect changes and auditing.

## Bookmarks

`/dashboard/bookmarks` shows saved community posts. Bookmarks are stored in `post_bookmarks`.

## Impact

`/dashboard/impact` shows supporter impact charts based on giving and participation records.

## Profile Editing

`/dashboard/profile/edit` lets users maintain public profile data. The save action uses `save_user_public_profile`.

## Account Security

`/dashboard/security` supports global session revocation. This is useful if the user signed in on a shared or lost device.
