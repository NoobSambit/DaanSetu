'use client'

import { useActionState, useEffect, useState } from 'react'
import {
  Building2,
  Check,
  Eye,
  Globe2,
  HeartHandshake,
  MapPin,
  ShieldCheck,
  Upload,
} from 'lucide-react'

import {
  INITIAL_NGO_PROFILE_STATE,
  saveNgoProfileAction,
} from '@/app/ngo/profile/actions'
import {
  BENEFICIARY_GROUPS,
  IMPACT_AREAS,
  NGO_CAUSES,
  NGO_CAUSE_LABELS,
  ORGANIZATION_TYPES,
} from '@/lib/ngo/profile'

const fieldClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
const labelClass = 'mb-2 block text-sm font-semibold text-slate-800'

const sectionDefinitions = [
  { title: 'Basic Information', description: 'Identity, mission, and organization story', icon: Building2 },
  { title: 'Location', description: 'Registered address and map position', icon: MapPin },
  { title: 'Impact Focus', description: 'Causes, programs, and beneficiaries', icon: HeartHandshake },
  { title: 'Trust & Verification', description: 'Legal details and private documents', icon: ShieldCheck },
  { title: 'Social Presence', description: 'Website, contact, and social links', icon: Globe2 },
  { title: 'Discoverability', description: 'Public visibility and opportunities', icon: Eye },
]

type ProfileData = Record<string, any>
type VerificationData = Record<string, any> | null
type DocumentData = {
  id: string
  document_type: string
  original_name: string
  size_bytes: number
  created_at: string
}

interface NgoProfileFormProps {
  initialProfile: ProfileData
  initialStep: number
  initialCompletion: number
  profileStatus: 'draft' | 'published'
  ngoId: string | null
  verification: VerificationData
  initialDocuments: DocumentData[]
}

function FieldError({ name, errors }: { name: string; errors?: Record<string, string> }) {
  if (!errors?.[name]) return null
  return <p className="mt-1.5 text-sm text-red-700">{errors[name]}</p>
}

function CheckGrid({
  name,
  values,
  selected,
}: {
  name: string
  values: readonly string[]
  selected: string[]
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {values.map((value) => (
        <label
          key={value}
          className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100"
        >
          <input
            type="checkbox"
            name={name}
            value={value}
            defaultChecked={selected.includes(value)}
            className="h-4 w-4 rounded border-slate-300 text-blue-600"
          />
          <span>{value.split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join(' ')}</span>
        </label>
      ))}
    </div>
  )
}

function publicAssetUrl(path: string | null) {
  if (!path) return null
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  return base ? `${base}/storage/v1/object/public/ngos/${path.split('/').map(encodeURIComponent).join('/')}` : null
}

function AssetUploader({
  name,
  label,
  assetType,
  initialPath,
}: {
  name: string
  label: string
  assetType: 'logo' | 'cover'
  initialPath?: string | null
}) {
  const [path, setPath] = useState(initialPath ?? '')
  const [preview, setPreview] = useState(publicAssetUrl(initialPath ?? null))
  const [status, setStatus] = useState('')

  async function upload(file: File) {
    setStatus('Uploading...')
    const body = new FormData()
    body.set('file', file)
    body.set('assetType', assetType)
    const response = await fetch('/api/ngo/profile-assets', { method: 'POST', body })
    const result = await response.json()
    if (!response.ok) {
      setStatus(result.error ?? 'Upload failed.')
      return
    }
    setPath(result.path)
    setPreview(result.url)
    setStatus('Uploaded')
  }

  return (
    <div>
      <span className={labelClass}>{label}</span>
      <input type="hidden" name={name} value={path} />
      <label className="flex min-h-28 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-600 focus-within:ring-2 focus-within:ring-blue-100">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={`${label} preview`} className="h-28 w-full object-cover" />
        ) : (
          <span className="flex items-center gap-2"><Upload className="h-4 w-4" /> Upload {label.toLowerCase()}</span>
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(event) => event.target.files?.[0] && upload(event.target.files[0])}
        />
      </label>
      {status && <p className="mt-1 text-xs text-slate-500" aria-live="polite">{status}</p>}
    </div>
  )
}

function VerificationDocuments({
  verificationId,
  initialDocuments,
  disabled,
}: {
  verificationId?: string
  initialDocuments: DocumentData[]
  disabled: boolean
}) {
  const [documents, setDocuments] = useState(initialDocuments)
  const [documentType, setDocumentType] = useState('registration')
  const [status, setStatus] = useState('')

  async function upload(file: File) {
    if (!verificationId) return
    setStatus('Uploading document...')
    const body = new FormData()
    body.set('file', file)
    body.set('verificationId', verificationId)
    body.set('documentType', documentType)
    const response = await fetch('/api/ngo/verification-documents', { method: 'POST', body })
    const result = await response.json()
    if (!response.ok) {
      setStatus(result.error ?? 'Upload failed.')
      return
    }
    setDocuments((current) => [...current, result.document])
    setStatus('Document uploaded.')
  }

  async function remove(documentId: string) {
    const response = await fetch('/api/ngo/verification-documents', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId }),
    })
    if (response.ok) setDocuments((current) => current.filter((document) => document.id !== documentId))
  }

  if (!verificationId) {
    return <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Save the legal details once to enable private document uploads.</p>
  }

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 p-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <select
          value={documentType}
          onChange={(event) => setDocumentType(event.target.value)}
          className={fieldClass}
          aria-label="Document type"
          disabled={disabled}
        >
          <option value="registration">Registration certificate</option>
          <option value="pan">PAN document</option>
          <option value="12a">12A certificate</option>
          <option value="80g">80G certificate</option>
          <option value="fcra">FCRA certificate</option>
          <option value="supporting">Supporting document</option>
        </select>
        <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white focus-within:ring-2 focus-within:ring-blue-300">
          <Upload className="h-4 w-4" /> Upload document
          <input
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            className="sr-only"
            disabled={disabled}
            onChange={(event) => event.target.files?.[0] && upload(event.target.files[0])}
          />
        </label>
      </div>
      <p className="text-xs text-slate-500">PDF, JPEG, or PNG. Maximum 10 MB. Documents are private.</p>
      {documents.map((document) => (
        <div key={document.id} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm">
          <span className="truncate pr-3">{document.original_name}</span>
          {!disabled && <button type="button" onClick={() => remove(document.id)} className="min-h-8 text-red-700 hover:underline">Remove</button>}
        </div>
      ))}
      <p className="text-sm text-slate-600" aria-live="polite">{status}</p>
    </div>
  )
}

export default function NgoProfileForm({
  initialProfile,
  initialStep,
  initialCompletion,
  profileStatus,
  ngoId,
  verification,
  initialDocuments,
}: NgoProfileFormProps) {
  const [step, setStep] = useState(Math.min(6, Math.max(1, initialStep)))
  const [state, formAction, pending] = useActionState(saveNgoProfileAction, {
    ...INITIAL_NGO_PROFILE_STATE,
    completionPercentage: initialCompletion,
    verificationId: verification?.id,
  })

  useEffect(() => {
    if (state.nextStep) setStep(state.nextStep)
  }, [state.nextStep])

  const active = sectionDefinitions[step - 1]
  const verificationStatus = verification?.verification_status ?? 'not-submitted'
  const social = initialProfile.socialLinks ?? {}

  return (
    <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[260px_minmax(0,1fr)_260px]">
      <aside className="rounded-xl border border-slate-200 bg-white p-5 lg:sticky lg:top-6 lg:self-start">
        <p className="text-sm font-semibold text-blue-700">NGO onboarding</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-950">Organization profile</h1>
        <p className="mt-2 text-sm text-slate-600">Build a trustworthy public profile and save progress at any time.</p>
        <nav className="mt-6 space-y-2" aria-label="Profile sections">
          {sectionDefinitions.map((section, index) => {
            const Icon = section.icon
            const activeSection = step === index + 1
            return (
              <button
                key={section.title}
                type="button"
                onClick={() => setStep(index + 1)}
                aria-current={activeSection ? 'step' : undefined}
                className={`flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium ${activeSection ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{index + 1}. {section.title}</span>
              </button>
            )
          })}
        </nav>
      </aside>

      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-8">
        <div className="mb-6 border-b border-slate-200 pb-5">
          <p className="text-sm font-semibold text-blue-700">Step {step} of 6</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">{active.title}</h2>
          <p className="mt-1 text-sm text-slate-600">{active.description}</p>
        </div>

        {state.message && (
          <div
            role={state.status === 'error' ? 'alert' : 'status'}
            className={`mb-5 rounded-lg border px-4 py-3 text-sm ${state.status === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-green-200 bg-green-50 text-green-800'}`}
          >
            {state.message}
          </div>
        )}

        <form action={formAction} className="space-y-5">
          <input type="hidden" name="step" value={step} />

          {step === 1 && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <AssetUploader name="logoPath" label="Organization logo" assetType="logo" initialPath={initialProfile.logoPath} />
                <AssetUploader name="coverImagePath" label="Cover image" assetType="cover" initialPath={initialProfile.coverImagePath} />
              </div>
              <div><label htmlFor="legalName" className={labelClass}>Registered legal name *</label><input id="legalName" name="legalName" defaultValue={initialProfile.legalName ?? ''} className={fieldClass} maxLength={180} /><FieldError name="legalName" errors={state.fieldErrors} /></div>
              <div><label htmlFor="displayName" className={labelClass}>Public display name *</label><input id="displayName" name="displayName" defaultValue={initialProfile.displayName ?? ''} className={fieldClass} maxLength={150} /><FieldError name="displayName" errors={state.fieldErrors} /></div>
              <div><label htmlFor="tagline" className={labelClass}>Tagline *</label><input id="tagline" name="tagline" defaultValue={initialProfile.tagline ?? ''} className={fieldClass} maxLength={180} /><FieldError name="tagline" errors={state.fieldErrors} /></div>
              <div><label htmlFor="description" className={labelClass}>About the organization *</label><textarea id="description" name="description" defaultValue={initialProfile.description ?? ''} rows={5} className={fieldClass} maxLength={2000} /><FieldError name="description" errors={state.fieldErrors} /></div>
              <div><label htmlFor="mission" className={labelClass}>Mission *</label><textarea id="mission" name="mission" defaultValue={initialProfile.mission ?? ''} rows={3} className={fieldClass} maxLength={1000} /><FieldError name="mission" errors={state.fieldErrors} /></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label htmlFor="foundingYear" className={labelClass}>Founding year *</label><input id="foundingYear" name="foundingYear" type="number" min="1800" max={new Date().getFullYear()} defaultValue={initialProfile.foundingYear ?? ''} className={fieldClass} /><FieldError name="foundingYear" errors={state.fieldErrors} /></div>
                <div><label htmlFor="organizationType" className={labelClass}>Organization type *</label><select id="organizationType" name="organizationType" defaultValue={initialProfile.organizationType ?? ''} className={fieldClass}><option value="">Select type</option>{ORGANIZATION_TYPES.map((type) => <option key={type} value={type}>{type.split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join(' ')}</option>)}</select><FieldError name="organizationType" errors={state.fieldErrors} /></div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div><label htmlFor="addressLine1" className={labelClass}>Address line 1 *</label><input id="addressLine1" name="addressLine1" defaultValue={initialProfile.addressLine1 ?? ''} className={fieldClass} maxLength={200} /><FieldError name="addressLine1" errors={state.fieldErrors} /></div>
              <div><label htmlFor="addressLine2" className={labelClass}>Address line 2</label><input id="addressLine2" name="addressLine2" defaultValue={initialProfile.addressLine2 ?? ''} className={fieldClass} maxLength={200} /></div>
              <div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="city" className={labelClass}>City *</label><input id="city" name="city" defaultValue={initialProfile.city ?? ''} className={fieldClass} maxLength={100} /><FieldError name="city" errors={state.fieldErrors} /></div><div><label htmlFor="state" className={labelClass}>State *</label><input id="state" name="state" defaultValue={initialProfile.state ?? ''} className={fieldClass} maxLength={100} /><FieldError name="state" errors={state.fieldErrors} /></div></div>
              <div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="postalCode" className={labelClass}>Postal code *</label><input id="postalCode" name="postalCode" defaultValue={initialProfile.postalCode ?? ''} className={fieldClass} maxLength={20} /><FieldError name="postalCode" errors={state.fieldErrors} /></div><div><label htmlFor="countryCode" className={labelClass}>Country code *</label><input id="countryCode" name="countryCode" defaultValue={initialProfile.countryCode ?? 'IN'} className={fieldClass} maxLength={2} /></div></div>
              <div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="latitude" className={labelClass}>Latitude</label><input id="latitude" name="latitude" type="number" step="any" min="-90" max="90" defaultValue={initialProfile.latitude ?? ''} className={fieldClass} /><FieldError name="latitude" errors={state.fieldErrors} /></div><div><label htmlFor="longitude" className={labelClass}>Longitude</label><input id="longitude" name="longitude" type="number" step="any" min="-180" max="180" defaultValue={initialProfile.longitude ?? ''} className={fieldClass} /></div></div>
              <p className="text-xs text-slate-500">Coordinates are optional. Profiles without them will not appear on the map.</p>
            </>
          )}

          {step === 3 && (
            <>
              <div><label htmlFor="primaryCause" className={labelClass}>Primary cause *</label><select id="primaryCause" name="primaryCause" defaultValue={initialProfile.primaryCause ?? ''} className={fieldClass}><option value="">Select a cause</option>{NGO_CAUSES.map((cause) => <option key={cause} value={cause}>{NGO_CAUSE_LABELS[cause]}</option>)}</select><FieldError name="primaryCause" errors={state.fieldErrors} /></div>
              <fieldset><legend className={labelClass}>Impact areas *</legend><CheckGrid name="impactAreas" values={IMPACT_AREAS} selected={initialProfile.impactAreas ?? []} /><FieldError name="impactAreas" errors={state.fieldErrors} /></fieldset>
              <fieldset><legend className={labelClass}>Beneficiary groups *</legend><CheckGrid name="beneficiaryGroups" values={BENEFICIARY_GROUPS} selected={initialProfile.beneficiaryGroups ?? []} /><FieldError name="beneficiaryGroups" errors={state.fieldErrors} /></fieldset>
              <div><label htmlFor="programSummary" className={labelClass}>Programs and initiatives *</label><textarea id="programSummary" name="programSummary" defaultValue={initialProfile.programSummary ?? ''} rows={4} className={fieldClass} maxLength={1500} /><FieldError name="programSummary" errors={state.fieldErrors} /></div>
            </>
          )}

          {step === 4 && (
            <>
              <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">Current status: <strong>{verificationStatus.replace('-', ' ')}</strong>. Legal details and documents are never shown publicly.</div>
              <div><label htmlFor="verificationLegalName" className={labelClass}>Registered legal name *</label><input id="verificationLegalName" name="verificationLegalName" defaultValue={verification?.legal_name ?? initialProfile.legalName ?? ''} className={fieldClass} disabled={verificationStatus === 'pending' || verificationStatus === 'verified'} /><FieldError name="verificationLegalName" errors={state.fieldErrors} /></div>
              <div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="registrationNumber" className={labelClass}>Registration number *</label><input id="registrationNumber" name="registrationNumber" defaultValue={verification?.registration_number ?? ''} className={fieldClass} disabled={verificationStatus === 'pending' || verificationStatus === 'verified'} /><FieldError name="registrationNumber" errors={state.fieldErrors} /></div><div><label htmlFor="registrationType" className={labelClass}>Registration type *</label><select id="registrationType" name="registrationType" defaultValue={verification?.registration_type ?? ''} className={fieldClass} disabled={verificationStatus === 'pending' || verificationStatus === 'verified'}><option value="">Select type</option><option value="trust">Trust</option><option value="society">Society</option><option value="section-8-company">Section 8 company</option><option value="other">Other</option></select><FieldError name="registrationType" errors={state.fieldErrors} /></div></div>
              <div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="registrationDate" className={labelClass}>Registration date</label><input id="registrationDate" name="registrationDate" type="date" defaultValue={verification?.registration_date ?? ''} className={fieldClass} disabled={verificationStatus === 'pending' || verificationStatus === 'verified'} /></div><div><label htmlFor="panNumber" className={labelClass}>PAN</label><input id="panNumber" name="panNumber" defaultValue={verification?.pan_number ?? ''} className={fieldClass} maxLength={10} disabled={verificationStatus === 'pending' || verificationStatus === 'verified'} /></div></div>
              <div><label htmlFor="ngoDarpanId" className={labelClass}>NGO Darpan ID</label><input id="ngoDarpanId" name="ngoDarpanId" defaultValue={verification?.ngo_darpan_id ?? ''} className={fieldClass} disabled={verificationStatus === 'pending' || verificationStatus === 'verified'} /></div>
              <div><label htmlFor="registeredAddress" className={labelClass}>Registered address</label><textarea id="registeredAddress" name="registeredAddress" defaultValue={verification?.registered_address ?? ''} rows={3} className={fieldClass} disabled={verificationStatus === 'pending' || verificationStatus === 'verified'} /></div>
              <div className="grid gap-2 sm:grid-cols-3">{[['has12a', '12A registered', verification?.has_12a], ['has80g', '80G approved', verification?.has_80g], ['hasFcra', 'FCRA registered', verification?.has_fcra]].map(([name, label, value]) => <label key={String(name)} className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm"><input type="checkbox" name={String(name)} defaultChecked={Boolean(value)} disabled={verificationStatus === 'pending' || verificationStatus === 'verified'} /> {String(label)}</label>)}</div>
              <VerificationDocuments verificationId={state.verificationId ?? verification?.id} initialDocuments={initialDocuments} disabled={verificationStatus === 'pending' || verificationStatus === 'verified'} />
            </>
          )}

          {step === 5 && (
            <>
              <div><label htmlFor="websiteUrl" className={labelClass}>Website</label><input id="websiteUrl" name="websiteUrl" type="text" inputMode="url" defaultValue={initialProfile.websiteUrl ?? ''} className={fieldClass} placeholder="https://example.org" /></div>
              <div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="publicEmail" className={labelClass}>Public email</label><input id="publicEmail" name="publicEmail" type="email" defaultValue={initialProfile.publicEmail ?? ''} className={fieldClass} /></div><div><label htmlFor="publicPhone" className={labelClass}>Public phone</label><input id="publicPhone" name="publicPhone" type="tel" defaultValue={initialProfile.publicPhone ?? ''} className={fieldClass} /></div></div>
              {[['facebookUrl', 'Facebook', social.facebook], ['instagramUrl', 'Instagram', social.instagram], ['linkedinUrl', 'LinkedIn', social.linkedin], ['youtubeUrl', 'YouTube', social.youtube]].map(([name, label, value]) => <div key={name}><label htmlFor={name} className={labelClass}>{label}</label><input id={name} name={name} defaultValue={value ?? ''} className={fieldClass} inputMode="url" /></div>)}
            </>
          )}

          {step === 6 && (
            <fieldset className="space-y-3"><legend className={labelClass}>Visibility preferences</legend>{[['isDiscoverable', 'Show this profile in the NGO directory and search', initialProfile.isDiscoverable], ['acceptsDonations', 'Show donation actions on the public profile', initialProfile.acceptsDonations], ['acceptsVolunteers', 'Show volunteer availability on the public profile', initialProfile.acceptsVolunteers]].map(([name, label, value]) => <label key={String(name)} className="flex min-h-14 items-center gap-3 rounded-lg border border-slate-200 px-4 text-sm text-slate-700"><input type="checkbox" name={String(name)} defaultChecked={value !== false} className="h-4 w-4" /><span>{String(label)}</span></label>)}</fieldset>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
            <button type="button" onClick={() => setStep((current) => Math.max(1, current - 1))} disabled={step === 1 || pending} className="min-h-11 rounded-lg border border-slate-300 px-5 text-sm font-semibold text-slate-700 disabled:opacity-40">Previous</button>
            <div className="flex flex-wrap gap-3">
              <button type="submit" name="intent" value="save" disabled={pending} className="min-h-11 rounded-lg border border-slate-300 px-5 text-sm font-semibold text-slate-800 disabled:opacity-50">Save draft</button>
              {step === 4 && verificationStatus !== 'pending' && verificationStatus !== 'verified' && <button type="submit" name="intent" value="submit-verification" disabled={pending} className="min-h-11 rounded-lg border border-blue-600 px-5 text-sm font-semibold text-blue-700 disabled:opacity-50">Submit verification</button>}
              {step < 6 ? <button type="submit" name="intent" value="next" disabled={pending} className="min-h-11 rounded-lg bg-blue-600 px-6 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">Save and continue</button> : <button type="submit" name="intent" value="publish" disabled={pending} className="min-h-11 rounded-lg bg-blue-600 px-6 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{profileStatus === 'published' ? 'Update public profile' : 'Publish profile'}</button>}
            </div>
          </div>
        </form>
      </section>

      <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between"><h2 className="font-semibold text-slate-900">Setup progress</h2><span className="text-2xl font-bold text-blue-700">{state.completionPercentage ?? initialCompletion}%</span></div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${state.completionPercentage ?? initialCompletion}%` }} /></div>
          <p className="mt-3 text-sm text-slate-600">Status: <span className="font-medium text-slate-900">{profileStatus}</span></p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900">Profile preview</h2>
          <div className="mt-4 flex h-16 w-16 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Building2 className="h-8 w-8" /></div>
          <p className="mt-4 font-semibold text-slate-950">{initialProfile.displayName || 'Your organization'}</p>
          <p className="mt-1 text-sm text-slate-600">{initialProfile.tagline || 'Your mission and impact will appear here.'}</p>
          {ngoId && profileStatus === 'published' && <a href={`/ngos/${ngoId}`} className="mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-blue-700 hover:underline">View public profile</a>}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600"><Check className="mb-2 h-5 w-5 text-green-600" />Drafts and verification documents are protected by account-level access controls.</div>
      </aside>
    </div>
  )
}
