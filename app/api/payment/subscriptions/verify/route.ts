import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { getCurrentSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { subscriptions } from '@/lib/db/schema'
import { verifySubscriptionSignature } from '@/lib/domain/payments'
const input=z.object({subscriptionId:z.string(),paymentId:z.string(),signature:z.string().length(64)})
export async function POST(request:Request){const session=await getCurrentSession();if(!session)return NextResponse.json({error:'Unauthorized'},{status:401});const parsed=input.safeParse(await request.json().catch(()=>null));const secret=process.env.RAZORPAY_KEY_SECRET;if(!parsed.success||!secret||!verifySubscriptionSignature({...parsed.data,secret}))return NextResponse.json({error:'Verification failed'},{status:400});const [record]=await db.select({id:subscriptions.id}).from(subscriptions).where(and(eq(subscriptions.gatewaySubscriptionId,parsed.data.subscriptionId),eq(subscriptions.userId,session.user.id))).limit(1);if(!record)return NextResponse.json({error:'Unknown subscription'},{status:404});await db.update(subscriptions).set({status:'authenticated',updatedAt:new Date()}).where(eq(subscriptions.id,record.id));return NextResponse.json({success:true})}
