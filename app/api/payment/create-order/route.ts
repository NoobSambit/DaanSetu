import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { campaigns, paymentOrders, payoutAccounts } from '@/lib/db/schema'
import { getCurrentSession } from '@/lib/auth/session'
import { canAcceptDonation } from '@/lib/domain/payments'

export const runtime = 'nodejs'
const input = z.object({ campaignId: z.string().uuid(), amountPaise: z.number().int().min(1000).max(100_000_000) })

export async function POST(request: Request) {
  const session = await getCurrentSession()
  if (!session) return NextResponse.json({ error: 'Sign in to donate.' }, { status: 401 })
  if (process.env.PAYMENTS_ENABLED !== 'true') return NextResponse.json({ error: 'Online donations are currently unavailable.' }, { status: 503 })
  const parsed = input.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Enter a valid donation amount and campaign.' }, { status: 400 })
  const [campaign] = await db.select({ status: campaigns.status, payoutStatus: payoutAccounts.status }).from(campaigns).leftJoin(payoutAccounts, eq(campaigns.payoutAccountId, payoutAccounts.id)).where(eq(campaigns.id, parsed.data.campaignId)).limit(1)
  if (!campaign || !canAcceptDonation({ campaignStatus: campaign.status, payoutStatus: campaign.payoutStatus ?? '', paymentsEnabled: true })) return NextResponse.json({ error: 'This campaign cannot accept donations until its payout account is active.' }, { status: 409 })
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !keySecret) return NextResponse.json({ error: 'Payment provider is not configured.' }, { status: 503 })
  const gateway = new Razorpay({ key_id: keyId, key_secret: keySecret })
  const order = await gateway.orders.create({ amount: parsed.data.amountPaise, currency: 'INR', receipt: `ds_${crypto.randomUUID()}`, notes: { userId: session.user.id, campaignId: parsed.data.campaignId } })
  await db.insert(paymentOrders).values({ userId: session.user.id, campaignId: parsed.data.campaignId, amountPaise: parsed.data.amountPaise, gatewayOrderId: order.id, expiresAt: new Date(Date.now() + 30 * 60_000) })
  return NextResponse.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId })
}
