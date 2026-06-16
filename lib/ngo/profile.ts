import { z } from 'zod'

export const NGO_CAUSES = [
  'education',
  'food',
  'health',
  'women',
  'animals',
  'children',
  'environment',
  'livelihoods',
  'disability',
  'disaster-relief',
  'elderly',
  'human-rights',
  'rural-development',
  'arts-culture',
  'other',
] as const

export const NGO_CAUSE_LABELS: Record<(typeof NGO_CAUSES)[number], string> = {
  education: 'Education',
  food: 'Food and hunger',
  health: 'Health',
  women: "Women's empowerment",
  animals: 'Animal welfare',
  children: 'Children',
  environment: 'Environment',
  livelihoods: 'Livelihoods',
  disability: 'Disability inclusion',
  'disaster-relief': 'Disaster relief',
  elderly: 'Elder care',
  'human-rights': 'Human rights',
  'rural-development': 'Rural development',
  'arts-culture': 'Arts and culture',
  other: 'Other',
}

export const IMPACT_AREAS = [
  'access-to-education',
  'girls-education',
  'digital-literacy',
  'nutrition',
  'primary-healthcare',
  'mental-health',
  'water-sanitation',
  'skills-employment',
  'rural-development',
  'climate-action',
  'animal-rescue',
  'emergency-response',
] as const

export const BENEFICIARY_GROUPS = [
  'children',
  'youth',
  'women-and-girls',
  'persons-with-disabilities',
  'older-adults',
  'rural-communities',
  'urban-poor',
  'farmers',
  'animals',
] as const

export const ORGANIZATION_TYPES = [
  'trust',
  'society',
  'section-8-company',
  'nonprofit-company',
  'other',
] as const

export const PROFILE_SECTIONS = [
  'basic',
  'location',
  'impact',
  'verification',
  'social',
  'discoverability',
] as const

export type NgoProfileSection = (typeof PROFILE_SECTIONS)[number]
export type NgoCause = (typeof NGO_CAUSES)[number]
export type NgoProfileStatus = 'draft' | 'published'

const optionalText = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    const trimmed = value?.trim()
    return trimmed ? trimmed : null
  })

const optionalInteger = z.coerce.number().int().nullable().optional().catch(null).transform((value) => value ?? null)

function canonicalUrl(value: unknown): string | null {
  const parsed = optionalText.parse(value)
  if (!parsed) return null

  const candidate = /^https?:\/\//i.test(parsed) ? parsed : `https://${parsed}`
  const url = new URL(candidate)
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Unsupported URL protocol')
  }
  return url.toString()
}

const socialLinksSchema = z
  .record(z.string(), z.union([z.string(), z.null(), z.undefined()]))
  .optional()
  .default({})
  .transform((links) =>
    Object.fromEntries(
      Object.entries(links)
        .map(([key, value]) => [key, canonicalUrl(value)] as const)
        .filter((entry): entry is [string, string] => Boolean(entry[1]))
    )
  )

const profileInputSchema = z.object({
  legalName: optionalText,
  displayName: optionalText,
  tagline: optionalText,
  description: optionalText,
  mission: optionalText,
  foundingYear: z.coerce.number().int().nullable().optional().catch(null).transform((value) => value ?? null),
  organizationType: z.enum(ORGANIZATION_TYPES).nullable().optional().catch(null).transform((value) => value ?? null),
  logoPath: optionalText.optional(),
  coverImagePath: optionalText.optional(),
  addressLine1: optionalText,
  addressLine2: optionalText,
  city: optionalText,
  state: optionalText,
  postalCode: optionalText,
  countryCode: optionalText.transform((value) => value?.toUpperCase() ?? 'IN'),
  latitude: z.coerce.number().nullable().optional().catch(null).transform((value) => value ?? null),
  longitude: z.coerce.number().nullable().optional().catch(null).transform((value) => value ?? null),
  primaryCause: z.enum(NGO_CAUSES).nullable().optional().catch(null).transform((value) => value ?? null),
  impactAreas: z.array(z.string()).optional().default([]).transform(uniqueStrings),
  beneficiaryGroups: z.array(z.string()).optional().default([]).transform(uniqueStrings),
  programSummary: optionalText,
  vision: optionalText,
  theoryOfChange: optionalText,
  coreValues: z.array(z.string()).optional().default([]).transform(uniqueStrings),
  operatingStates: z.array(z.string()).optional().default([]).transform(uniqueStrings),
  teamSize: optionalInteger,
  beneficiariesReached: optionalInteger,
  communitiesServed: optionalInteger,
  volunteersEngaged: optionalInteger,
  websiteUrl: z.unknown().transform(canonicalUrl),
  publicEmail: optionalText,
  publicPhone: optionalText,
  socialLinks: socialLinksSchema,
  isDiscoverable: z.coerce.boolean().optional().default(true),
  acceptsDonations: z.coerce.boolean().optional().default(true),
  acceptsVolunteers: z.coerce.boolean().optional().default(true),
})

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))]
}

export type NgoProfileInput = z.infer<typeof profileInputSchema>

export function normalizeNgoProfileInput(input: unknown): NgoProfileInput {
  return profileInputSchema.parse(input)
}

const publicationSchema = profileInputSchema.superRefine((profile, context) => {
  const requiredText: Array<[keyof NgoProfileInput, string, number]> = [
    ['legalName', 'Enter the registered organization name.', 2],
    ['displayName', 'Enter the public organization name.', 2],
    ['tagline', 'Add a short tagline of at least 10 characters.', 10],
    ['description', 'Describe the organization in at least 40 characters.', 40],
    ['mission', 'Describe your organization mission.', 20],
    ['addressLine1', 'Enter the organization address.', 3],
    ['city', 'Enter the city.', 2],
    ['state', 'Enter the state.', 2],
    ['postalCode', 'Enter the postal code.', 3],
    ['programSummary', 'Describe your main programs.', 20],
  ]

  for (const [field, message, minimum] of requiredText) {
    const value = profile[field]
    if (typeof value !== 'string' || value.length < minimum) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: [field], message })
    }
  }

  const currentYear = new Date().getFullYear()
  if (!profile.foundingYear || profile.foundingYear < 1800 || profile.foundingYear > currentYear) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['foundingYear'],
      message: `Enter a founding year between 1800 and ${currentYear}.`,
    })
  }
  if (!profile.organizationType) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['organizationType'],
      message: 'Select an organization type.',
    })
  }
  if (!profile.primaryCause) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['primaryCause'],
      message: 'Select a primary cause.',
    })
  }
  if (profile.impactAreas.length === 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['impactAreas'],
      message: 'Select at least one impact area.',
    })
  }
  if (profile.beneficiaryGroups.length === 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['beneficiaryGroups'],
      message: 'Select at least one beneficiary group.',
    })
  }
  for (const [field, label] of [
    ['teamSize', 'Team size'],
    ['beneficiariesReached', 'Beneficiaries reached'],
    ['communitiesServed', 'Communities served'],
    ['volunteersEngaged', 'Volunteers engaged'],
  ] as const) {
    const value = profile[field]
    if (value !== null && value < 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [field],
        message: `${label} cannot be negative.`,
      })
    }
  }
  if (profile.countryCode !== 'IN' && profile.countryCode?.length !== 2) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['countryCode'],
      message: 'Use a two-letter country code.',
    })
  }
  if ((profile.latitude === null) !== (profile.longitude === null)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['latitude'],
      message: 'Provide both latitude and longitude, or leave both blank.',
    })
  }
  if (profile.latitude !== null && (profile.latitude < -90 || profile.latitude > 90)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['latitude'],
      message: 'Latitude must be between -90 and 90.',
    })
  }
  if (profile.longitude !== null && (profile.longitude < -180 || profile.longitude > 180)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['longitude'],
      message: 'Longitude must be between -180 and 180.',
    })
  }
  if (profile.publicEmail && !z.string().email().safeParse(profile.publicEmail).success) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['publicEmail'],
      message: 'Enter a valid public email address.',
    })
  }
  if (profile.publicPhone && profile.publicPhone.replace(/\D/g, '').length < 8) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['publicPhone'],
      message: 'Enter a valid public phone number.',
    })
  }
})

export type NgoProfileValidationResult =
  | { success: true; data: NgoProfileInput }
  | { success: false; fieldErrors: Record<string, string> }

export function canPublishNgoProfile(input: unknown): NgoProfileValidationResult {
  const result = publicationSchema.safeParse(input)
  if (result.success) return { success: true, data: result.data }

  const fieldErrors: Record<string, string> = {}
  for (const issue of result.error.issues) {
    const field = String(issue.path[0] ?? 'form')
    fieldErrors[field] ??= issue.message
  }
  return { success: false, fieldErrors }
}

function hasText(value: unknown, minimum = 1): boolean {
  return typeof value === 'string' && value.trim().length >= minimum
}

export function calculateNgoProfileCompletion(
  input: unknown,
  options: {
    verificationStatus?: string | null
    onboardingStep?: number | null
  } = {}
) {
  const profile = normalizeNgoProfileInput(input)
  const step = options.onboardingStep ?? 0
  const sectionComplete = {
    basic:
      hasText(profile.legalName, 2) &&
      hasText(profile.displayName, 2) &&
      hasText(profile.tagline, 10) &&
      hasText(profile.description, 40) &&
      hasText(profile.mission, 20) &&
      Boolean(profile.foundingYear && profile.organizationType),
    location:
      hasText(profile.addressLine1, 3) &&
      hasText(profile.city, 2) &&
      hasText(profile.state, 2) &&
      hasText(profile.postalCode, 3),
    impact:
      Boolean(profile.primaryCause) &&
      profile.impactAreas.length > 0 &&
      profile.beneficiaryGroups.length > 0 &&
      hasText(profile.programSummary, 20),
    // Verification is complete once the user has saved section 4 (even as draft).
    // The admin review status (pending/verified) is independent of profile completion.
    verification:
      options.verificationStatus === 'pending' ||
      options.verificationStatus === 'verified' ||
      options.verificationStatus === 'draft' ||
      step >= 5,
    // Social presence is optional — mark complete once the user has reached/saved
    // section 5, regardless of whether any links were provided.
    social:
      step >= 6 ||
      Boolean(profile.websiteUrl || profile.publicEmail || profile.publicPhone) ||
      Object.keys(profile.socialLinks).length > 0,
    // Discoverability is complete once the user has saved section 6.
    discoverability:
      step >= 6 &&
      typeof profile.isDiscoverable === 'boolean' &&
      typeof profile.acceptsDonations === 'boolean' &&
      typeof profile.acceptsVolunteers === 'boolean',
  }
  const completedSections = Object.values(sectionComplete).filter(Boolean).length

  return {
    sectionComplete,
    completedSections,
    totalSections: PROFILE_SECTIONS.length,
    percentage: Math.round((completedSections / PROFILE_SECTIONS.length) * 100),
  }
}

export function getNgoProfileVisibility(input: {
  profileStatus: NgoProfileStatus
  isDiscoverable: boolean
}) {
  const canViewDirectly = input.profileStatus === 'published'
  return {
    canViewDirectly,
    includeInDirectory: canViewDirectly && input.isDiscoverable,
  }
}

const DOCUMENT_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png'])
const DOCUMENT_EXTENSIONS = new Set(['pdf', 'jpg', 'jpeg', 'png'])

export function validateVerificationDocument(file: {
  name: string
  type: string
  size: number
}): string | null {
  if (file.size > 10 * 1024 * 1024) {
    return 'Document size must not exceed 10 MB.'
  }
  const extension = file.name.toLowerCase().split('.').pop()
  if (!DOCUMENT_TYPES.has(file.type) || !extension || !DOCUMENT_EXTENSIONS.has(extension)) {
    return 'Upload a PDF, JPEG, or PNG document.'
  }
  return null
}
