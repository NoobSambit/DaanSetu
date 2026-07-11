import assert from 'node:assert/strict'
import test from 'node:test'

import {
  assertCampaignTransition,
  calculateCsrMatch,
  financialYearFor,
  formatPaise,
} from '../../lib/domain/finance.ts'
import { can } from '../../lib/domain/authorization.ts'
import { rankRecommendations } from '../../lib/domain/recommendations.ts'

test('money remains integer paise and CSR caps are deterministic', () => {
  assert.equal(formatPaise(12345), '₹123.45')
  assert.equal(calculateCsrMatch({ donationPaise: 10_000, percentage: 50, remainingUserCapPaise: 3_000, remainingProgramCapPaise: 8_000 }), 3_000)
  assert.throws(() => formatPaise(1.2), /integer paise/)
})

test('financial years use the Indian April to March boundary', () => {
  assert.deepEqual(financialYearFor(new Date('2026-03-31T12:00:00+05:30')), { startYear: 2025, endYear: 2026, label: 'FY 2025-26' })
  assert.deepEqual(financialYearFor(new Date('2026-04-01T12:00:00+05:30')), { startYear: 2026, endYear: 2027, label: 'FY 2026-27' })
})

test('campaign state machine rejects activation without approval and payout', () => {
  assert.doesNotThrow(() => assertCampaignTransition('pending_review', 'approved', { payoutActive: false }))
  assert.doesNotThrow(() => assertCampaignTransition('approved', 'active', { payoutActive: true }))
  assert.throws(() => assertCampaignTransition('draft', 'active', { payoutActive: true }), /Invalid campaign transition/)
  assert.throws(() => assertCampaignTransition('approved', 'active', { payoutActive: false }), /active payout account/)
})

test('authorization denies cross-owner mutations and admin self-selection', () => {
  assert.equal(can({ userId: 'u1', role: 'supporter', emailVerified: true }, 'campaign:create'), true)
  assert.equal(can({ userId: 'u1', role: 'supporter', emailVerified: false }, 'post:create'), false)
  assert.equal(can({ userId: 'u1', role: 'ngo', emailVerified: true }, 'campaign:update', { ownerId: 'u2' }), false)
  assert.equal(can({ userId: 'admin', role: 'admin', emailVerified: true }, 'campaign:moderate'), true)
})

test('recommendations are deterministic and never introduce unknown records', () => {
  const candidates = [
    { id: 'near-health', categories: ['health'], skills: [], state: 'Odisha', followed: false, donatedBefore: false, recentScore: 2 },
    { id: 'followed-education', categories: ['education'], skills: ['teaching'], state: 'Delhi', followed: true, donatedBefore: true, recentScore: 1 },
  ]
  const ranked = rankRecommendations(candidates, { categories: ['education'], skills: ['teaching'], state: 'Odisha' })
  assert.deepEqual(ranked.map((item) => item.id), ['followed-education', 'near-health'])
  assert.deepEqual(new Set(ranked.map((item) => item.id)), new Set(candidates.map((item) => item.id)))
})
