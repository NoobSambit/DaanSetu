import { createHmac, timingSafeEqual } from 'node:crypto'

function safeHexEqual(expected: string, supplied: string) {
  if (!/^[a-f0-9]{64}$/i.test(supplied)) return false
  const a = Buffer.from(expected, 'hex')
  const b = Buffer.from(supplied, 'hex')
  return a.length === b.length && timingSafeEqual(a, b)
}

export function verifyCheckoutSignature(input: { orderId: string; paymentId: string; signature: string; secret: string }) {
  const expected = createHmac('sha256', input.secret).update(`${input.orderId}|${input.paymentId}`).digest('hex')
  return safeHexEqual(expected, input.signature)
}
export function verifySubscriptionSignature(input: { subscriptionId: string; paymentId: string; signature: string; secret: string }) {
  const expected = createHmac('sha256', input.secret).update(`${input.paymentId}|${input.subscriptionId}`).digest('hex')
  return safeHexEqual(expected, input.signature)
}

export function verifyWebhookSignature(rawBody: Buffer, signature: string, secret: string) {
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
  return safeHexEqual(expected, signature)
}

export function webhookEventDecision(input: { previouslyProcessed: boolean; signatureValid: boolean }) {
  if (!input.signatureValid) return { process: false, reason: 'invalid_signature' as const }
  if (input.previouslyProcessed) return { process: false, reason: 'duplicate' as const }
  return { process: true, reason: 'new' as const }
}

export function canAcceptDonation(input: { campaignStatus: string; payoutStatus: string; paymentsEnabled: boolean }) {
  return input.paymentsEnabled && input.campaignStatus === 'active' && input.payoutStatus === 'active'
}
