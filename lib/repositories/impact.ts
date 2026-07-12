import 'server-only'
import { eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { campaigns, donations, ngoProfiles } from '@/lib/db/schema'
import { searchCampaigns } from './discovery'

export async function getPublicImpact() {
  const [totals] = await db.select({ fundsPaise: sql<number>`coalesce(sum(case when ${donations.status}='captured' then ${donations.amountPaise} else 0 end),0)::bigint`, donations: sql<number>`count(case when ${donations.status}='captured' then 1 end)::int` }).from(donations)
  const [campaignCount] = await db.select({ count: sql<number>`count(*)::int` }).from(campaigns).where(eq(campaigns.status, 'active'))
  const [ngoStats] = await db.select({ verified: sql<number>`count(case when ${ngoProfiles.verificationStatus}='verified' then 1 end)::int`, states: sql<number>`count(distinct ${ngoProfiles.state})::int` }).from(ngoProfiles).where(eq(ngoProfiles.isDiscoverable, true))
  const featuredCampaigns = await searchCampaigns({ pageSize: 3 })
  const locations = await db.select({ id: ngoProfiles.id, name: ngoProfiles.displayName, latitude: ngoProfiles.latitude, longitude: ngoProfiles.longitude }).from(ngoProfiles).where(eq(ngoProfiles.isDiscoverable, true))
  return { fundsPaise: totals.fundsPaise, donationCount: totals.donations, activeCampaigns: campaignCount.count, verifiedNgos: ngoStats.verified, statesReached: ngoStats.states, featuredCampaigns, locations: locations.filter((item): item is typeof item & { latitude: number; longitude: number } => item.latitude != null && item.longitude != null) }
}
