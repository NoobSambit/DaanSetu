import Link from 'next/link'
import { notFound } from 'next/navigation'
import DonateButton from '@/components/DonateButton'
import CampaignProgress from '@/components/CampaignProgress'
import { getCurrentSession } from '@/lib/auth/session'
import { formatPaise } from '@/lib/domain/finance'
import { getCampaignDetail } from '@/lib/repositories/discovery'

export const dynamic = 'force-dynamic'
export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [campaign, session] = await Promise.all([getCampaignDetail(id), getCurrentSession()])
  if (!campaign || (campaign.status !== 'active' && campaign.creatorId !== session?.user.id)) notFound()
  const progress = Math.min(100, campaign.raisedPaise / campaign.targetPaise * 100)
  const donationEnabled = campaign.status === 'active' && campaign.payoutStatus === 'active' && process.env.PAYMENTS_ENABLED === 'true'
  return <main className="min-h-screen bg-slate-50"><div className="mx-auto max-w-5xl px-4 py-10"><Link href="/campaigns" className="text-sm font-semibold text-blue-700">← Back to campaigns</Link>
    <article className="mt-5 overflow-hidden rounded-2xl border bg-white shadow-sm">{campaign.imageUrl && <img src={campaign.imageUrl} alt="" className="h-80 w-full object-cover"/>}<div className="p-8"><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase text-blue-700">{campaign.category}</span><h1 className="mt-4 text-4xl font-bold text-slate-950">{campaign.title}</h1>{campaign.ngoId && <Link href={`/ngos/${campaign.ngoId}`} className="mt-3 inline-block font-semibold text-blue-700">by {campaign.ngoName} · {[campaign.ngoCity,campaign.ngoState].filter(Boolean).join(', ')}</Link>}<p className="mt-5 text-lg text-slate-600">{campaign.summary}</p><div className="mt-6"><CampaignProgress currentAmount={campaign.raisedPaise / 100} goalAmount={campaign.targetPaise / 100} progress={progress} daysRemaining={campaign.daysRemaining}/></div>
    <div className="mt-6">{donationEnabled && campaign.ngoId ? <DonateButton ngoId={campaign.ngoId} ngoName={campaign.ngoName ?? 'Campaign beneficiary'} isAuthenticated={!!session} campaignId={campaign.id} campaignTitle={campaign.title}/> : <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">Donations are disabled until this campaign and its linked payout account are active.</div>}</div></div></article>
    <section className="mt-6 rounded-2xl border bg-white p-8"><h2 className="text-2xl font-bold">About this campaign</h2><p className="mt-4 whitespace-pre-wrap leading-7 text-slate-700">{campaign.story}</p><dl className="mt-6 grid gap-4 border-t pt-6 sm:grid-cols-2"><div><dt className="text-sm text-slate-500">Raised from captured payments</dt><dd className="font-bold">{formatPaise(campaign.raisedPaise)}</dd></div><div><dt className="text-sm text-slate-500">Target</dt><dd className="font-bold">{formatPaise(campaign.targetPaise)}</dd></div></dl></section>
  </div></main>
}
