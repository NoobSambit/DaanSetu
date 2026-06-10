import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const migration = readFileSync(
  new URL('../../supabase/migrations/015_ngo_profile_redesign.sql', import.meta.url),
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
