'use server'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { auditLogs, posts, reports } from '@/lib/db/schema'
async function admin(){const session=await requireSession();if(session.user.role!=='admin')throw new Error('Forbidden');return session}
export async function moderateReportAction(form:FormData){const session=await admin();const data=z.object({reportId:z.string().uuid(),postId:z.string().uuid(),decision:z.enum(['hide','dismiss'])}).parse(Object.fromEntries(form));await db.transaction(async tx=>{if(data.decision==='hide')await tx.update(posts).set({hiddenAt:new Date(),updatedAt:new Date()}).where(eq(posts.id,data.postId));await tx.update(reports).set({status:data.decision==='hide'?'actioned':'dismissed',reviewedBy:session.user.id,reviewedAt:new Date()}).where(eq(reports.id,data.reportId));await tx.insert(auditLogs).values({actorId:session.user.id,action:`moderation.${data.decision}`,entityType:'post',entityId:data.postId})});revalidatePath('/admin/moderation')}
export async function featureStoryAction(form:FormData){const session=await admin();const postId=z.string().uuid().parse(form.get('postId'));await db.update(posts).set({approvedAt:new Date(),featuredAt:new Date(),updatedAt:new Date()}).where(eq(posts.id,postId));await db.insert(auditLogs).values({actorId:session.user.id,action:'impact_story.feature',entityType:'post',entityId:postId});revalidatePath('/admin/moderation')}
