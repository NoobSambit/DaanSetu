import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { and, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db'
import { csrInitiatives, csrMatchPledges, donations, paymentOrders, receipts } from '@/lib/db/schema'
import { getCurrentSession } from '@/lib/auth/session'
import { calculateCsrMatch, financialYearFor } from '@/lib/domain/finance'
import { verifyCheckoutSignature } from '@/lib/domain/payments'

const input = z.object({ orderId: z.string().min(3), paymentId: z.string().min(3), signature: z.string().length(64) })
export async function POST(request: Request) {
  const session = await getCurrentSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const parsed = input.safeParse(await request.json().catch(() => null))
  const secret = process.env.RAZORPAY_KEY_SECRET
  if (!parsed.success || !secret || !verifyCheckoutSignature({ ...parsed.data, secret })) return NextResponse.json({ error: 'Payment verification failed.' }, { status: 400 })
  const [order] = await db.select().from(paymentOrders).where(and(eq(paymentOrders.gatewayOrderId, parsed.data.orderId), eq(paymentOrders.userId, session.user.id))).limit(1)
  if (!order) return NextResponse.json({ error: 'Unknown payment order.' }, { status: 404 })
  const gateway = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID!, key_secret: secret })
  const payment = await gateway.payments.fetch(parsed.data.paymentId)
  if (payment.order_id !== order.gatewayOrderId || payment.status !== 'captured' || Number(payment.amount) !== order.amountPaise) return NextResponse.json({ error: 'Payment has not been captured.' }, { status: 409 })
  const donation = await db.transaction(async (tx) => {
    const existing = await tx.select().from(donations).where(eq(donations.gatewayPaymentId, parsed.data.paymentId)).limit(1)
    if (existing[0]) return existing[0]
    const [created] = await tx.insert(donations).values({ donorId: session.user.id, campaignId: order.campaignId, amountPaise: order.amountPaise, gatewayOrderId: order.gatewayOrderId, gatewayPaymentId: parsed.data.paymentId, status: 'captured', capturedAt: new Date(),csrInitiativeId:order.csrInitiativeId,corporateEmployeeId:order.corporateEmployeeId }).returning()
    const fy = financialYearFor(created.capturedAt)
    await tx.insert(receipts).values({ donationId: created.id, receiptNumber: `DS-${fy.startYear}-${created.id.slice(0, 8).toUpperCase()}`, financialYear: fy.label })
    if(order.csrInitiativeId&&order.corporateEmployeeId){const[initiative]=await tx.select().from(csrInitiatives).where(eq(csrInitiatives.id,order.csrInitiativeId));const[used]=await tx.select({employee:sql<number>`coalesce(sum(case when ${csrMatchPledges.employeeId}=${order.corporateEmployeeId} then ${csrMatchPledges.amountPaise} else 0 end),0)::bigint`,program:sql<number>`coalesce(sum(${csrMatchPledges.amountPaise}),0)::bigint`}).from(csrMatchPledges).where(eq(csrMatchPledges.initiativeId,order.csrInitiativeId));const amount=calculateCsrMatch({donationPaise:order.amountPaise,percentage:initiative.matchPercentage,remainingUserCapPaise:Math.max(0,initiative.perEmployeeCapPaise-used.employee),remainingProgramCapPaise:Math.max(0,initiative.programCapPaise-used.program)});await tx.insert(csrMatchPledges).values({initiativeId:initiative.id,employeeId:order.corporateEmployeeId,donationId:created.id,amountPaise:amount})}
    await tx.update(paymentOrders).set({ status: 'captured', updatedAt: new Date() }).where(eq(paymentOrders.id, order.id))
    return created
  })
  return NextResponse.json({ success: true, donationId: donation.id, receiptAvailable: true })
}
