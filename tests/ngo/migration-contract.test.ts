import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const migration = readFileSync(
  new URL('../../supabase/migrations/015_ngo_profile_redesign.sql', import.meta.url),
  'utf8'
)
const publicProfileContentMigration = readFileSync(
  new URL('../../supabase/migrations/016_public_ngo_profile_content.sql', import.meta.url),
  'utf8'
)

test('migration preserves legacy NGOs while making new profiles draft-first', () => {
  assert.match(migration, /profile_status = COALESCE\(profile_status, 'published'\)/)
  assert.match(migration, /ALTER COLUMN profile_status SET DEFAULT 'draft'/)
  assert.match(migration, /idx_ngos_one_per_user/)
})

test('public RLS exposes published profiles but keeps drafts owner-scoped', () => {
  assert.match(migration, /profile_status = 'published'\s+OR user_id = auth\.uid\(\)/)
  assert.match(migration, /NGO accounts create their own profile/)
})

test('verification documents use a private bucket and admin-only review access', () => {
  assert.match(migration, /'ngo-verification', 'ngo-verification', FALSE/)
  assert.match(migration, /Admins read verification files/)
  assert.match(migration, /size_bytes > 0 AND size_bytes <= 10485760/)
})

test('profile assets use a public NGO bucket with owner-scoped writes', () => {
  assert.match(migration, /'ngos', 'ngos', TRUE/)
  assert.match(migration, /Public read NGO profile assets/)
  assert.match(migration, /NGO owners upload profile assets/)
  assert.match(migration, /\(storage\.foldername\(name\)\)\[1\] = auth\.uid\(\)::TEXT/)
  assert.match(migration, /\(storage\.foldername\(name\)\)\[2\] IN \('logo', 'cover'\)/)
})

test('public NGO profile content migration adds rich profile fields', () => {
  assert.match(publicProfileContentMigration, /ADD COLUMN IF NOT EXISTS vision TEXT/)
  assert.match(publicProfileContentMigration, /ADD COLUMN IF NOT EXISTS theory_of_change TEXT/)
  assert.match(publicProfileContentMigration, /ADD COLUMN IF NOT EXISTS core_values TEXT\[\] NOT NULL DEFAULT '\{\}'/)
  assert.match(publicProfileContentMigration, /ADD COLUMN IF NOT EXISTS operating_states TEXT\[\] NOT NULL DEFAULT '\{\}'/)
  assert.match(publicProfileContentMigration, /ngos_beneficiaries_reached_nonnegative/)
})

test('public NGO profile content migration prepares dashboard-managed content tables', () => {
  assert.match(publicProfileContentMigration, /CREATE TABLE IF NOT EXISTS public\.ngo_programs/)
  assert.match(publicProfileContentMigration, /CREATE TABLE IF NOT EXISTS public\.ngo_updates/)
  assert.match(publicProfileContentMigration, /CREATE TABLE IF NOT EXISTS public\.ngo_gallery_images/)
  assert.match(publicProfileContentMigration, /CREATE TABLE IF NOT EXISTS public\.ngo_service_areas/)
  assert.match(publicProfileContentMigration, /Public can read active NGO programs/)
  assert.match(publicProfileContentMigration, /NGO owners manage gallery images/)
})

test('public NGO asset storage supports future dashboard media folders', () => {
  assert.match(publicProfileContentMigration, /\(storage\.foldername\(name\)\)\[2\] IN \('logo', 'cover', 'gallery', 'programs', 'updates'\)/)
})
