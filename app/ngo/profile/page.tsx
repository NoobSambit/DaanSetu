import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import NgoProfileForm from '@/components/auth/NgoProfileForm'
import { getUserRole } from '@/lib/auth/profile'
import { calculateNgoProfileCompletion } from '@/lib/ngo/profile'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Organization profile | DaanSetu' }
export const dynamic = 'force-dynamic'

function toProfileInput(row: Record<string, any> | null) {
  if (!row) return {}
  return {
    legalName: row.legal_name,
    displayName: row.display_name ?? row.name,
    tagline: row.tagline,
    description: row.description,
    mission: row.mission,
    foundingYear: row.founding_year,
    organizationType: row.organization_type,
    logoPath: row.logo_path,
    coverImagePath: row.cover_image_path,
    addressLine1: row.address_line_1,
    addressLine2: row.address_line_2,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    countryCode: row.country_code ?? 'IN',
    latitude: row.latitude,
    longitude: row.longitude,
    primaryCause: row.category,
    impactAreas: row.impact_areas ?? [],
    beneficiaryGroups: row.beneficiary_groups ?? [],
    programSummary: row.program_summary,
    websiteUrl: row.website_url,
    publicEmail: row.public_email,
    publicPhone: row.public_phone,
    socialLinks: row.social_links ?? {},
    isDiscoverable: row.is_discoverable ?? true,
    acceptsDonations: row.accepts_donations ?? true,
    acceptsVolunteers: row.accepts_volunteers ?? true,
  }
}

export default async function NgoProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?next=/ngo/profile')
  if ((await getUserRole(supabase, user.id)) !== 'ngo') redirect('/dashboard')

  const { data: ngo } = await supabase.from('ngos').select('*').eq('user_id', user.id).maybeSingle()
  const profile = toProfileInput(ngo)
  const completion = calculateNgoProfileCompletion(profile)

  let verification = null
  let documents: Array<{
    id: string
    document_type: string
    original_name: string
    size_bytes: number
    created_at: string
  }> = []
  if (ngo) {
    const result = await supabase
      .from('ngo_verifications')
      .select('*')
      .eq('ngo_id', ngo.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    verification = result.data
    if (verification) {
      const documentResult = await supabase
        .from('ngo_verification_documents')
        .select('id, document_type, original_name, size_bytes, created_at')
        .eq('verification_id', verification.id)
        .order('created_at')
      documents = documentResult.data ?? []
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <NgoProfileForm
        initialProfile={profile}
        initialStep={ngo?.onboarding_step ?? 1}
        initialCompletion={completion.percentage}
        profileStatus={ngo?.profile_status ?? 'draft'}
        ngoId={ngo?.id ?? null}
        verification={verification}
        initialDocuments={documents}
      />
    </main>
  )
}
