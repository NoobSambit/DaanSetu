import { NextResponse } from 'next/server'
import { eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { csrInitiatives, csrMatchPledges, csrSettlementBatches, donations, paymentEvents, paymentOrders, receipts, refunds, subscriptions } from '@/lib/db/schema'
import { verifyWebhookSignature } from '@/lib/domain/payments'
import { calculateCsrMatch, financialYearFor } from '@/lib/domain/finance'

export const runtime = 'nodejs'
export async function POST(request: Request) {
  const raw = Buffer.from(await request.arrayBuffer())
  const signature = request.headers.get('x-razorpay-signature') ?? ''
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? ''
  if (!secret || !verifyWebhookSignature(raw, signature, secret)) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  const payload = JSON.parse(raw.toString()) as { event?: string; payload?: Record<string,{entity?:Record<string,unknown>}> }
  const eventId=request.headers.get('x-razorpay-event-id')
  if (!eventId || !payload.event) return NextResponse.json({ error: 'Invalid event' }, { status: 400 })
  const eventType=payload.event
  const inserted=await db.insert(paymentEvents).values({ gatewayEventId:eventId,eventType,payload }).onConflictDoNothing({target:paymentEvents.gatewayEventId}).returning({id:paymentEvents.id})
  if(!inserted[0])return NextResponse.json({accepted:true,duplicate:true})
  const payment=payload.payload?.payment?.entity; const subscription=payload.payload?.subscription?.entity; const refund=payload.payload?.refund?.entity
  await db.transaction(async tx=>{
    if(eventType==='payment.captured'&&payment){const orderId=String(payment.order_id??'');const paymentId=String(payment.id??'');const [order]=await tx.select().from(paymentOrders).where(eq(paymentOrders.gatewayOrderId,orderId)).limit(1);if(order&&Number(payment.amount)===order.amountPaise){const existing=await tx.select().from(donations).where(eq(donations.gatewayPaymentId,paymentId)).limit(1);if(!existing[0]){const[created]=await tx.insert(donations).values({donorId:order.userId,campaignId:order.campaignId,amountPaise:order.amountPaise,gatewayOrderId:orderId,gatewayPaymentId:paymentId,status:'captured',capturedAt:new Date(Number(payment.created_at??Date.now()/1000)*1000),csrInitiativeId:order.csrInitiativeId,corporateEmployeeId:order.corporateEmployeeId}).returning();const fy=financialYearFor(created.capturedAt);await tx.insert(receipts).values({donationId:created.id,receiptNumber:`DS-${fy.startYear}-${created.id.slice(0,8).toUpperCase()}`,financialYear:fy.label});if(order.csrInitiativeId&&order.corporateEmployeeId){const[initiative]=await tx.select().from(csrInitiatives).where(eq(csrInitiatives.id,order.csrInitiativeId));const[used]=await tx.select({employee:sql<number>`coalesce(sum(case when ${csrMatchPledges.employeeId}=${order.corporateEmployeeId} then ${csrMatchPledges.amountPaise} else 0 end),0)::bigint`,program:sql<number>`coalesce(sum(${csrMatchPledges.amountPaise}),0)::bigint`}).from(csrMatchPledges).where(eq(csrMatchPledges.initiativeId,order.csrInitiativeId));const amount=calculateCsrMatch({donationPaise:order.amountPaise,percentage:initiative.matchPercentage,remainingUserCapPaise:Math.max(0,initiative.perEmployeeCapPaise-used.employee),remainingProgramCapPaise:Math.max(0,initiative.programCapPaise-used.program)});await tx.insert(csrMatchPledges).values({initiativeId:initiative.id,employeeId:order.corporateEmployeeId,donationId:created.id,amountPaise:amount})}}await tx.update(paymentOrders).set({status:'captured',updatedAt:new Date()}).where(eq(paymentOrders.id,order.id))}}
    if(eventType==='payment.captured'&&payment){const orderId=String(payment.order_id??'');const paymentId=String(payment.id??'');const[batch]=await tx.select().from(csrSettlementBatches).where(eq(csrSettlementBatches.gatewayOrderId,orderId)).limit(1);if(batch&&batch.status!=='settled'&&Number(payment.amount)===batch.amountPaise){await tx.update(csrSettlementBatches).set({gatewayPaymentId:paymentId,status:'settled',settledAt:new Date()}).where(eq(csrSettlementBatches.id,batch.id));await tx.update(csrMatchPledges).set({status:'allocated'}).where(eq(csrMatchPledges.batchId,batch.id))}}
    if(eventType.startsWith('subscription.')&&subscription){await tx.update(subscriptions).set({status:String(subscription.status??eventType.slice(13)),updatedAt:new Date()}).where(eq(subscriptions.gatewaySubscriptionId,String(subscription.id??'')))}
    if(eventType.startsWith('refund.')&&refund){await tx.update(refunds).set({status:String(refund.status??'processed'),updatedAt:new Date()}).where(eq(refunds.gatewayRefundId,String(refund.id??'')))}
    await tx.update(paymentEvents).set({processedAt:new Date()}).where(eq(paymentEvents.gatewayEventId,eventId))
  })
  return NextResponse.json({ accepted: true })
}
