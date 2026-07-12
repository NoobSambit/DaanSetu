import { and, gt, or, eq, isNull } from 'drizzle-orm'
import { getCurrentSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { realtimeEvents } from '@/lib/db/schema'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function GET(request:Request){const session=await getCurrentSession();if(!session)return new Response('Unauthorized',{status:401});const after=Number(new URL(request.url).searchParams.get('after')??0);const events=await db.select().from(realtimeEvents).where(and(gt(realtimeEvents.id,after),or(isNull(realtimeEvents.audienceUserId),eq(realtimeEvents.audienceUserId,session.user.id)))).limit(100);const body=events.map(e=>`id: ${e.id}\nevent: ${e.topic}\ndata: ${JSON.stringify(e.payload)}\n\n`).join('')||': heartbeat\n\n';return new Response(body,{headers:{'content-type':'text/event-stream','cache-control':'no-cache, no-transform','x-accel-buffering':'no'}})}
