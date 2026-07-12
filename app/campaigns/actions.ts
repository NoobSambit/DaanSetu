'use server'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { campaigns, ngoProfiles, payoutAccounts } from '@/lib/db/schema'
import { requireSession } from '@/lib/auth/session'

const campaignInput = z.object({ title: z.string().trim().min(8).max(120), shortDescription: z.string().trim().min(20).max(240), story: z.string().trim().min(100).max(12_000), category: z.string().trim().min(2).max(60), targetRupees: z.coerce.number().int().min(1000).max(100_000_000), deadline: z.coerce.date().refine(d => d.getTime() > Date.now(), 'Deadline must be in the future.'), ngoId: z.string().uuid().optional().or(z.literal('')), beneficiaryName: z.string().trim().max(120).optional(), beneficiaryConsent: z.string().optional(), evidenceUrl: z.string().url().optional().or(z.literal('')) })

export async function createCampaignAction(formData: FormData) {
  const session = await requireSession()
  if (!session.user.emailVerified) throw new Error('Verify your email before creating a fundraiser.')
  const parsed = campaignInput.safeParse(Object.fromEntries(formData))
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Invalid campaign details.')
  const ngoId = parsed.data.ngoId || null
  if (!ngoId && (!parsed.data.beneficiaryName || parsed.data.beneficiaryConsent !== 'on' || !parsed.data.evidenceUrl)) throw new Error('Supporter fundraisers require beneficiary identity, consent, and evidence.')
  if (ngoId) { const owned = await db.select({ id: ngoProfiles.id }).from(ngoProfiles).where(and(eq(ngoProfiles.id, ngoId), eq(ngoProfiles.ownerId, session.user.id))).limit(1); if (!owned[0]) throw new Error('You do not manage this NGO.') }
  const [payout] = await db.select({ id: payoutAccounts.id }).from(payoutAccounts).where(and(eq(payoutAccounts.ownerId, session.user.id), eq(payoutAccounts.status, 'active'))).limit(1)
  const [created] = await db.insert(campaigns).values({ creatorId: session.user.id, ngoId, payoutAccountId: payout?.id, title: parsed.data.title, shortDescription: parsed.data.shortDescription, story: parsed.data.story, category: parsed.data.category, targetPaise: parsed.data.targetRupees * 100, deadline: parsed.data.deadline, beneficiary: ngoId ? null : { name: parsed.data.beneficiaryName, consent: true }, evidence: parsed.data.evidenceUrl ? [{ url: parsed.data.evidenceUrl }] : [], status: 'pending_review' }).returning({ id: campaigns.id })
  redirect(`/campaigns/${created.id}`)
}
