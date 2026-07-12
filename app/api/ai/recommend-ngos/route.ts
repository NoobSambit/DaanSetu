import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getCurrentSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { campaigns, donations, volunteerProfiles } from '@/lib/db/schema'
import { rankRecommendations } from '@/lib/domain/recommendations'
import { searchNgos } from '@/lib/repositories/discovery'
export async function POST(){const session=await getCurrentSession();if(!session)return NextResponse.json({error:'Unauthorized'},{status:401});const history=await db.select({category:campaigns.category}).from(donations).innerJoin(campaigns,eq(donations.campaignId,campaigns.id)).where(eq(donations.donorId,session.user.id));const[profile]=await db.select().from(volunteerProfiles).where(eq(volunteerProfiles.userId,session.user.id));const rows=await searchNgos({pageSize:48});const ranked=rankRecommendations(rows.map(n=>({id:n.id,categories:n.categories,skills:[],state:n.state,followed:false,donatedBefore:n.categories.some(c=>history.some(h=>h.category===c)),recentScore:5})),{categories:[...new Set(history.map(h=>h.category))],skills:profile?.skills??[],state:profile?.state??null});return NextResponse.json({recommendations:ranked.map(r=>{const n=rows.find(x=>x.id===r.id)!;return{ngo_id:n.id,ngo_name:n.name,category:n.categories[0]??'other',reason:r.score?`Matched from your causes, skills, location, and activity (score ${r.score}).`:'Published organization'}})})}
