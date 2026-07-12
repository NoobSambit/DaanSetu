import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getCurrentSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { campaigns, donations, volunteerProfiles } from '@/lib/db/schema'
import { rankRecommendations } from '@/lib/domain/recommendations'
import { searchCampaigns } from '@/lib/repositories/discovery'
export async function POST(){const session=await getCurrentSession();if(!session)return NextResponse.json({error:'Unauthorized'},{status:401});const history=await db.select({category:campaigns.category}).from(donations).innerJoin(campaigns,eq(donations.campaignId,campaigns.id)).where(eq(donations.donorId,session.user.id));const[profile]=await db.select().from(volunteerProfiles).where(eq(volunteerProfiles.userId,session.user.id));const rows=await searchCampaigns({pageSize:30});const ranked=rankRecommendations(rows.map(c=>({id:c.id,categories:[c.category],skills:[],state:c.ngoState,followed:false,donatedBefore:history.some(h=>h.category===c.category),recentScore:5})),{categories:[...new Set(history.map(h=>h.category))],skills:profile?.skills??[],state:profile?.state??null});return NextResponse.json({recommendations:ranked.map(r=>{const c=rows.find(x=>x.id===r.id)!;return{campaign_id:c.id,campaign_title:c.title,category:c.category,short_description:c.summary,reason:r.score?`Matched from your causes, skills, location, and activity (score ${r.score}).`:'Active verified campaign'}})})}
