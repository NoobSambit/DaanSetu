import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const schema = readFileSync(new URL('../../lib/db/schema.ts', import.meta.url), 'utf8')
const migration = readFileSync(new URL('../../drizzle/0001_platform_foundation.sql', import.meta.url), 'utf8')

test('Drizzle is the active schema boundary for core platform records', () => {
  for (const table of ['users', 'sessions', 'ngo_profiles', 'campaigns', 'payout_accounts', 'donations', 'payment_events', 'volunteer_applications', 'posts', 'audit_logs']) {
    assert.match(schema, new RegExp(`pgTable\\(['\"]${table}['\"]`))
    assert.match(migration, new RegExp(`CREATE TABLE ${table}`))
  }
})

test('gateway identifiers and one-review-per-user constraints are unique', () => {
  assert.match(migration, /gateway_order_id[^;]+UNIQUE/)
  assert.match(migration, /gateway_payment_id[^;]+UNIQUE/)
  assert.match(migration, /gateway_event_id[^;]+UNIQUE/)
  assert.match(migration, /UNIQUE \(user_id, ngo_id\)/)
})

test('money and public content states have database constraints', () => {
  assert.match(migration, /amount_paise BIGINT NOT NULL CHECK \(amount_paise > 0\)/)
  assert.match(migration, /status campaign_status NOT NULL/)
  assert.match(migration, /hidden_at TIMESTAMPTZ/)
})
