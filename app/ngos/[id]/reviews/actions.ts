'use server'
import { and, eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { campaigns, donations, reviews, volunteerApplications, volunteerHours } from '@/lib/db/schema'
import { canReviewNgo } from '@/lib/domain/engagement'
export async function createReviewAction(form:FormData){const session=await requireSession();const data=z.object({ngoId:z.string().uuid(),rating:z.coerce.number().int().min(1).max(5),body:z.string().trim().min(20).max(2000)}).parse(Object.fromEntries(form));const[giving]=await db.select({count:sql<number>`count(*)::int`}).from(donations).innerJoin(campaigns,eq(donations.campaignId,campaigns.id)).where(and(eq(donations.donorId,session.user.id),eq(donations.status,'captured'),eq(campaigns.ngoId,data.ngoId)));const[service]=await db.select({minutes:sql<number>`coalesce(sum(${volunteerHours.minutes}),0)::int`}).from(volunteerHours).innerJoin(volunteerApplications,eq(volunteerHours.applicationId,volunteerApplications.id)).where(and(eq(volunteerApplications.userId,session.user.id),eq(volunteerApplications.ngoId,data.ngoId),eq(volunteerHours.status,'approved')));if(!canReviewNgo({capturedDonation:giving.count>0,approvedHours:service.minutes}))throw new Error('A captured donation or approved volunteer service is required.');await db.insert(reviews).values({userId:session.user.id,ngoId:data.ngoId,rating:data.rating,body:data.body}).onConflictDoUpdate({target:[reviews.userId,reviews.ngoId],set:{rating:data.rating,body:data.body}});revalidatePath(`/ngos/${data.ngoId}/reviews`)}
