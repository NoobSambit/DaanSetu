import 'server-only'
import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { campaigns, donations, ngoProfiles, payoutAccounts, reviews } from '@/lib/db/schema'

export type DiscoveryFilters = { search?: string; category?: string; city?: string; state?: string; verified?: boolean; eligible80g?: boolean; page?: number; pageSize?: number }

export async function searchNgos(filters: DiscoveryFilters) {
  const pageSize = Math.min(48, Math.max(1, filters.pageSize ?? 12))
  const page = Math.max(1, filters.page ?? 1)
  const clauses = [eq(ngoProfiles.isDiscoverable, true)]
  if (filters.search) clauses.push(or(ilike(ngoProfiles.displayName, `%${filters.search}%`), ilike(ngoProfiles.description, `%${filters.search}%`))!)
  if (filters.city) clauses.push(ilike(ngoProfiles.city, `%${filters.city}%`))
  if (filters.state) clauses.push(eq(ngoProfiles.state, filters.state))
  if (filters.category) clauses.push(sql`${filters.category} = ANY(${ngoProfiles.categories})`)
  if (filters.verified) clauses.push(eq(ngoProfiles.verificationStatus, 'verified'))
  if (filters.eligible80g) clauses.push(eq(ngoProfiles.is80gEligible, true))
  return db.select({ id: ngoProfiles.id, name: ngoProfiles.displayName, slug: ngoProfiles.slug, description: ngoProfiles.description, city: ngoProfiles.city, state: ngoProfiles.state, categories: ngoProfiles.categories, verified: sql<boolean>`${ngoProfiles.verificationStatus} = 'verified'`, eligible80g: ngoProfiles.is80gEligible, rating: sql<number>`coalesce(avg(${reviews.rating}), 0)::float`, reviewCount: sql<number>`count(${reviews.id})::int` }).from(ngoProfiles).leftJoin(reviews, and(eq(reviews.ngoId, ngoProfiles.id), sql`${reviews.hiddenAt} is null`)).where(and(...clauses)).groupBy(ngoProfiles.id).orderBy(desc(ngoProfiles.createdAt)).limit(pageSize).offset((page - 1) * pageSize)
}

export async function searchCampaigns(filters: { search?: string; category?: string; sort?: string; page?: number; pageSize?: number } = {}) {
  const clauses = [eq(campaigns.status, 'active'), eq(payoutAccounts.status, 'active')]
  if (filters.search) clauses.push(or(ilike(campaigns.title, `%${filters.search}%`), ilike(campaigns.story, `%${filters.search}%`))!)
  if (filters.category) clauses.push(eq(campaigns.category, filters.category))
  const order = filters.sort === 'deadline' ? asc(campaigns.deadline) : filters.sort === 'funded' ? desc(sql`coalesce(sum(${donations.amountPaise}), 0)`) : desc(campaigns.createdAt)
  return db.select({ id: campaigns.id, ngoId: campaigns.ngoId, title: campaigns.title, summary: campaigns.shortDescription, story: campaigns.story, category: campaigns.category, imageUrl: campaigns.imageUrl, deadline: campaigns.deadline, daysRemaining: sql<number>`greatest(0, ceil(extract(epoch from (${campaigns.deadline} - now())) / 86400))::int`, targetPaise: campaigns.targetPaise, raisedPaise: sql<number>`coalesce(sum(case when ${donations.status} = 'captured' then ${donations.amountPaise} else 0 end), 0)::bigint`, ngoName: ngoProfiles.displayName, ngoCity: ngoProfiles.city, ngoState: ngoProfiles.state }).from(campaigns).innerJoin(payoutAccounts, eq(campaigns.payoutAccountId, payoutAccounts.id)).leftJoin(ngoProfiles, eq(campaigns.ngoId, ngoProfiles.id)).leftJoin(donations, eq(donations.campaignId, campaigns.id)).where(and(...clauses)).groupBy(campaigns.id, ngoProfiles.id).orderBy(order).limit(Math.min(48, filters.pageSize ?? 12)).offset((Math.max(1, filters.page ?? 1) - 1) * (filters.pageSize ?? 12))
}

export async function getCampaignDetail(id: string) {
  const [campaign] = await db.select({ id: campaigns.id, ngoId: campaigns.ngoId, creatorId: campaigns.creatorId, title: campaigns.title, summary: campaigns.shortDescription, story: campaigns.story, category: campaigns.category, imageUrl: campaigns.imageUrl, deadline: campaigns.deadline, daysRemaining: sql<number>`greatest(0, ceil(extract(epoch from (${campaigns.deadline} - now())) / 86400))::int`, targetPaise: campaigns.targetPaise, status: campaigns.status, payoutStatus: payoutAccounts.status, raisedPaise: sql<number>`coalesce(sum(case when ${donations.status} = 'captured' then ${donations.amountPaise} else 0 end), 0)::bigint`, ngoName: ngoProfiles.displayName, ngoCity: ngoProfiles.city, ngoState: ngoProfiles.state }).from(campaigns).leftJoin(payoutAccounts, eq(campaigns.payoutAccountId, payoutAccounts.id)).leftJoin(ngoProfiles, eq(campaigns.ngoId, ngoProfiles.id)).leftJoin(donations, eq(donations.campaignId, campaigns.id)).where(eq(campaigns.id, id)).groupBy(campaigns.id, payoutAccounts.id, ngoProfiles.id)
  return campaign ?? null
}
