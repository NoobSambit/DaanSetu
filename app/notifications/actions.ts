'use server'
import { and, eq, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { requireSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { notifications } from '@/lib/db/schema'
export async function markAllReadAction(){const session=await requireSession();await db.update(notifications).set({readAt:new Date()}).where(and(eq(notifications.userId,session.user.id),isNull(notifications.readAt)));revalidatePath('/notifications')}
