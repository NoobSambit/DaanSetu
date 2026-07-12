'use server'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { donations, refunds } from '@/lib/db/schema'

export async function requestRefundAction(formData: FormData) { const session=await requireSession(); const parsed=z.object({donationId:z.string().uuid(),reason:z.string().trim().min(20).max(1000)}).safeParse(Object.fromEntries(formData)); if(!parsed.success)throw new Error('Provide a clear refund reason.'); const [donation]=await db.select({id:donations.id}).from(donations).where(and(eq(donations.id,parsed.data.donationId),eq(donations.donorId,session.user.id),eq(donations.status,'captured'))).limit(1); if(!donation)throw new Error('Donation is not eligible for a refund request.'); await db.insert(refunds).values({donationId:donation.id,requesterId:session.user.id,reason:parsed.data.reason}); revalidatePath('/dashboard/giving') }
