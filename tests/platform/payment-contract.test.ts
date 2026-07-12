import assert from 'node:assert/strict'
import test from 'node:test'

import {
  canAcceptDonation,
  verifyCheckoutSignature,
  verifyWebhookSignature,
  webhookEventDecision,
} from '../../lib/domain/payments.ts'

test('donations require an active campaign and compliant payout account', () => {
  assert.equal(canAcceptDonation({ campaignStatus: 'active', payoutStatus: 'active', paymentsEnabled: true }), true)
  assert.equal(canAcceptDonation({ campaignStatus: 'approved', payoutStatus: 'active', paymentsEnabled: true }), false)
  assert.equal(canAcceptDonation({ campaignStatus: 'active', payoutStatus: 'pending', paymentsEnabled: true }), false)
  assert.equal(canAcceptDonation({ campaignStatus: 'active', payoutStatus: 'active', paymentsEnabled: false }), false)
})

test('checkout signatures use timing-safe HMAC verification', () => {
  assert.equal(verifyCheckoutSignature({ orderId: 'order_1', paymentId: 'pay_1', signature: '52115a0d3400de9e86aade1f1b6eba9e8974604f4e267a9e9a16633a4c8dd2cb', secret: 'secret' }), true)
  assert.equal(verifyCheckoutSignature({ orderId: 'order_1', paymentId: 'pay_1', signature: 'bad', secret: 'secret' }), false)
})

test('webhooks verify the raw body and replay decisions are idempotent', () => {
  const rawBody = Buffer.from('{"event":"payment.captured"}')
  assert.equal(verifyWebhookSignature(rawBody, '501fbb0ad85a22a0b1a54a0e69d821052fdf86db1c58822f5581a2cbe89e6166', 'webhook'), true)
  assert.deepEqual(webhookEventDecision({ previouslyProcessed: false, signatureValid: true }), { process: true, reason: 'new' })
  assert.deepEqual(webhookEventDecision({ previouslyProcessed: true, signatureValid: true }), { process: false, reason: 'duplicate' })
  assert.deepEqual(webhookEventDecision({ previouslyProcessed: false, signatureValid: false }), { process: false, reason: 'invalid_signature' })
})
