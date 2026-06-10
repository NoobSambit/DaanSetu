/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BadgeCheck, ExternalLink, Globe2, Mail, MapPin, Phone } from 'lucide-react'

import DonateButton from '@/components/DonateButton'
import NGOMap from '@/components/NGOMap'
import { NGO_CAUSE_LABELS } from '@/lib/ngo/profile'
import { createClient } from '@/lib/supabase/server'
import type { NGO } from '@/lib/types/database.types'

export const dynamic = 'force-dynamic'

function assetUrl(path: string | null) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  return path && base ? `${base}/storage/v1/object/public/ngos/${path.split('/').map(encodeURIComponent).join('/')}` : null
}

export default async function NGOProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data } = await supabase.from('ngos').select('*').eq('id', id).eq('profile_status', 'published').maybeSingle()
  if (!data) notFound()
  const ngo = data as NGO
  const cover = assetUrl(ngo.cover_image_path)
  const logo = assetUrl(ngo.logo_path)
  const hasCoordinates = Number.isFinite(ngo.latitude) && Number.isFinite(ngo.longitude)
  const socialLinks = ngo.social_links ?? {}

  return (
    <main className="min-h-screen bg-slate-50 pb-12">
      <div className="h-52 bg-gradient-to-br from-blue-100 to-indigo-200 sm:h-72">{cover && <img src={cover} alt="" className="h-full w-full object-cover" />}</div>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <section className="relative -mt-14 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-blue-50 text-3xl font-bold text-blue-700 shadow">{logo ? <img src={logo} alt={`${ngo.name} logo`} className="h-full w-full object-cover" /> : ngo.name.slice(0, 1)}</div>
            <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h1 className="text-3xl font-bold text-slate-950">{ngo.display_name ?? ngo.name}</h1>{ngo.is_verified && <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700"><BadgeCheck className="h-4 w-4" /> Verified NGO</span>}</div><p className="mt-2 text-slate-600">{ngo.tagline ?? ngo.description}</p><p className="mt-3 flex items-center gap-1.5 text-sm text-slate-500"><MapPin className="h-4 w-4" /> {ngo.city}, {ngo.state}</p></div>
            {ngo.accepts_donations && <DonateButton ngoId={ngo.id} ngoName={ngo.name} isAuthenticated={Boolean(user)} />}
          </div>
          <div className="mt-6 flex flex-wrap gap-2"><span className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-800">{NGO_CAUSE_LABELS[ngo.category] ?? ngo.category}</span>{ngo.impact_areas?.map((area) => <span key={area} className="rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-700">{area.replaceAll('-', ' ')}</span>)}</div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <section className="rounded-xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-bold text-slate-950">About</h2><p className="mt-3 whitespace-pre-wrap leading-7 text-slate-700">{ngo.description}</p>{ngo.mission && <><h3 className="mt-6 font-semibold text-slate-950">Mission</h3><p className="mt-2 leading-7 text-slate-700">{ngo.mission}</p></>}</section>
            {ngo.program_summary && <section className="rounded-xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-bold text-slate-950">Programs and impact</h2><p className="mt-3 whitespace-pre-wrap leading-7 text-slate-700">{ngo.program_summary}</p>{ngo.beneficiary_groups?.length > 0 && <p className="mt-4 text-sm text-slate-600"><strong>Communities served:</strong> {ngo.beneficiary_groups.map((group) => group.replaceAll('-', ' ')).join(', ')}</p>}</section>}
            {hasCoordinates && <section className="rounded-xl border border-slate-200 bg-white p-6"><h2 className="mb-4 text-xl font-bold text-slate-950">Location</h2><div className="h-80 overflow-hidden rounded-lg"><NGOMap ngos={[ngo]} center={[ngo.latitude, ngo.longitude]} zoom={13} /></div></section>}
          </div>
          <aside className="space-y-6">
            <section className="rounded-xl border border-slate-200 bg-white p-6"><h2 className="font-bold text-slate-950">Organization details</h2><dl className="mt-4 space-y-3 text-sm"><div><dt className="text-slate-500">Founded</dt><dd className="font-medium text-slate-900">{ngo.founding_year ?? 'Not provided'}</dd></div><div><dt className="text-slate-500">Organization type</dt><dd className="font-medium capitalize text-slate-900">{ngo.organization_type?.replaceAll('-', ' ') ?? 'Not provided'}</dd></div></dl></section>
            {(ngo.website_url || ngo.public_email || ngo.public_phone || Object.keys(socialLinks).length > 0) && <section className="rounded-xl border border-slate-200 bg-white p-6"><h2 className="font-bold text-slate-950">Contact</h2><div className="mt-4 space-y-3 text-sm">{ngo.website_url && <a href={ngo.website_url} target="_blank" rel="noreferrer" className="flex min-h-8 items-center gap-2 text-blue-700 hover:underline"><Globe2 className="h-4 w-4" /> Website</a>}{ngo.public_email && <a href={`mailto:${ngo.public_email}`} className="flex min-h-8 items-center gap-2 text-blue-700 hover:underline"><Mail className="h-4 w-4" /> {ngo.public_email}</a>}{ngo.public_phone && <a href={`tel:${ngo.public_phone}`} className="flex min-h-8 items-center gap-2 text-blue-700 hover:underline"><Phone className="h-4 w-4" /> {ngo.public_phone}</a>}{Object.entries(socialLinks).map(([name, url]) => <a key={name} href={url} target="_blank" rel="noreferrer" className="flex min-h-8 items-center gap-2 capitalize text-blue-700 hover:underline"><ExternalLink className="h-4 w-4" /> {name}</a>)}</div></section>}
            {ngo.accepts_volunteers && <section className="rounded-xl border border-slate-200 bg-blue-50 p-6"><h2 className="font-bold text-slate-950">Volunteer with us</h2><p className="mt-2 text-sm text-slate-700">This organization welcomes volunteer interest.</p><Link href="/volunteer/opportunities" className="mt-4 inline-flex min-h-10 items-center font-semibold text-blue-700 hover:underline">View opportunities</Link></section>}
          </aside>
        </div>
      </div>
    </main>
  )
}
