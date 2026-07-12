import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { getCurrentSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { campaigns, payoutAccounts, subscriptions } from '@/lib/db/schema'
import { canAcceptDonation } from '@/lib/domain/payments'

const createInput = z.object({ campaignId: z.string().uuid(), amountPaise: z.number().int().min(1000), cadence: z.enum(['monthly','quarterly','yearly']) })
const updateInput = z.object({ subscriptionId: z.string().uuid(), action: z.enum(['pause','resume','cancel']) })
const periods = { monthly: { period:'monthly', interval:1 }, quarterly: { period:'monthly', interval:3 }, yearly: { period:'yearly', interval:1 } } as const
function gateway() { if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) throw new Error('Payment provider is not configured.'); return new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET }) }

export async function POST(request: Request) {
  const session = await getCurrentSession(); if (!session) return NextResponse.json({error:'Unauthorized'},{status:401})
  if (process.env.SUBSCRIPTIONS_ENABLED !== 'true') return NextResponse.json({error:'Recurring giving is unavailable.'},{status:503})
  const parsed=createInput.safeParse(await request.json().catch(()=>null)); if(!parsed.success)return NextResponse.json({error:'Invalid subscription.'},{status:400})
  const [campaign]=await db.select({status:campaigns.status,payoutStatus:payoutAccounts.status,title:campaigns.title}).from(campaigns).leftJoin(payoutAccounts,eq(campaigns.payoutAccountId,payoutAccounts.id)).where(eq(campaigns.id,parsed.data.campaignId)).limit(1)
  if(!campaign||!canAcceptDonation({campaignStatus:campaign.status,payoutStatus:campaign.payoutStatus??'',paymentsEnabled:true}))return NextResponse.json({error:'Campaign cannot accept recurring gifts.'},{status:409})
  const api=gateway(); const timing=periods[parsed.data.cadence]; const plan=await api.plans.create({period:timing.period,interval:timing.interval,item:{name:`DaanSetu: ${campaign.title}`,amount:parsed.data.amountPaise,currency:'INR'}}); const subscription=await api.subscriptions.create({plan_id:plan.id,total_count:parsed.data.cadence==='monthly'?120:parsed.data.cadence==='quarterly'?40:10,customer_notify:1,notes:{userId:session.user.id,campaignId:parsed.data.campaignId}})
  const [record]=await db.insert(subscriptions).values({userId:session.user.id,campaignId:parsed.data.campaignId,amountPaise:parsed.data.amountPaise,cadence:parsed.data.cadence,gatewayPlanId:plan.id,gatewaySubscriptionId:subscription.id,status:subscription.status}).returning({id:subscriptions.id})
  return NextResponse.json({id:record.id,gatewaySubscriptionId:subscription.id,keyId:process.env.RAZORPAY_KEY_ID})
}

export async function PATCH(request: Request) {
  const session=await getCurrentSession(); if(!session)return NextResponse.json({error:'Unauthorized'},{status:401}); const parsed=updateInput.safeParse(await request.json().catch(()=>null)); if(!parsed.success)return NextResponse.json({error:'Invalid action.'},{status:400})
  const [record]=await db.select().from(subscriptions).where(and(eq(subscriptions.id,parsed.data.subscriptionId),eq(subscriptions.userId,session.user.id))).limit(1); if(!record)return NextResponse.json({error:'Not found'},{status:404}); const api=gateway()
  if(parsed.data.action==='pause')await api.subscriptions.pause(record.gatewaySubscriptionId,{pause_at:'now'}); else if(parsed.data.action==='resume')await api.subscriptions.resume(record.gatewaySubscriptionId,{resume_at:'now'}); else await api.subscriptions.cancel(record.gatewaySubscriptionId,false)
  const status=parsed.data.action==='cancel'?'cancelled':parsed.data.action==='pause'?'paused':'active'; await db.update(subscriptions).set({status,updatedAt:new Date()}).where(eq(subscriptions.id,record.id)); return NextResponse.json({success:true,status})
}
