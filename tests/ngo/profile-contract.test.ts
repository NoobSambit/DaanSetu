import assert from 'node:assert/strict'
import test from 'node:test'

import {
  calculateNgoProfileCompletion,
  canPublishNgoProfile,
  getNgoProfileVisibility,
  normalizeNgoProfileInput,
  validateVerificationDocument,
} from '../../lib/ngo/profile.ts'

const completeProfile = {
  legalName: 'Pragati Foundation',
  displayName: 'Pragati Foundation',
  tagline: 'Education and opportunity for rural girls',
  description:
    'Pragati Foundation works with rural communities to improve access to education and long-term opportunity.',
  mission: 'Help every rural girl complete school and choose her future.',
  foundingYear: 2014,
  organizationType: 'trust',
  addressLine1: '12 Community Road',
  addressLine2: '',
  city: 'Jaipur',
  state: 'Rajasthan',
  postalCode: '302001',
  countryCode: 'IN',
  latitude: 26.9124,
  longitude: 75.7873,
  primaryCause: 'education',
  impactAreas: ['girls-education', 'digital-literacy'],
  beneficiaryGroups: ['children', 'women-and-girls'],
  programSummary: 'Scholarships, mentoring, and community learning centres.',
  vision: 'A just and equitable society where every child can reach their full potential.',
  theoryOfChange: 'Community-led education support improves attendance, learning outcomes, and confidence.',
  coreValues: ['Integrity', 'Inclusion', 'Transparency'],
  operatingStates: ['Rajasthan', 'Uttar Pradesh'],
  teamSize: 45,
  beneficiariesReached: 68500,
  communitiesServed: 320,
  volunteersEngaged: 1250,
  websiteUrl: 'https://pragati.example.org',
  publicEmail: 'hello@pragati.example.org',
  publicPhone: '+91 98765 43210',
  socialLinks: { linkedin: 'https://linkedin.com/company/pragati' },
  isDiscoverable: true,
  acceptsDonations: true,
  acceptsVolunteers: true,
}

test('normalizes optional profile values and canonical URLs', () => {
  const result = normalizeNgoProfileInput({
    ...completeProfile,
    addressLine2: '   ',
    websiteUrl: 'pragati.example.org',
    publicPhone: '  +91 98765 43210  ',
    impactAreas: ['girls-education', 'girls-education', 'digital-literacy'],
    coreValues: ['Integrity', 'Integrity', 'Inclusion'],
    operatingStates: ['Rajasthan', ' Rajasthan ', 'Uttar Pradesh'],
  })

  assert.equal(result.addressLine2, null)
  assert.equal(result.websiteUrl, 'https://pragati.example.org/')
  assert.equal(result.publicPhone, '+91 98765 43210')
  assert.deepEqual(result.impactAreas, ['girls-education', 'digital-literacy'])
  assert.deepEqual(result.coreValues, ['Integrity', 'Inclusion'])
  assert.deepEqual(result.operatingStates, ['Rajasthan', 'Uttar Pradesh'])
})

test('requires all core sections before publishing', () => {
  assert.equal(canPublishNgoProfile(completeProfile).success, true)

  const incomplete = canPublishNgoProfile({
    ...completeProfile,
    mission: '',
    impactAreas: [],
  })

  assert.equal(incomplete.success, false)
  if (!incomplete.success) {
    assert.equal(incomplete.fieldErrors.mission, 'Describe your organization mission.')
    assert.equal(incomplete.fieldErrors.impactAreas, 'Select at least one impact area.')
  }
})

test('rejects negative public impact metrics before publishing', () => {
  const invalid = canPublishNgoProfile({
    ...completeProfile,
    beneficiariesReached: -1,
    volunteersEngaged: -5,
  })

  assert.equal(invalid.success, false)
  if (!invalid.success) {
    assert.equal(invalid.fieldErrors.beneficiariesReached, 'Beneficiaries reached cannot be negative.')
    assert.equal(invalid.fieldErrors.volunteersEngaged, 'Volunteers engaged cannot be negative.')
  }
})

test('calculates section completion independently from publication', () => {
  const completion = calculateNgoProfileCompletion({
    ...completeProfile,
    websiteUrl: null,
    publicEmail: null,
    publicPhone: null,
    socialLinks: {},
  }, {
    verificationStatus: 'pending',
    onboardingStep: 6,
  })

  assert.equal(completion.completedSections, 5)
  assert.equal(completion.totalSections, 6)
  assert.equal(completion.percentage, 83)
})

test('does not mark default-only onboarding sections as complete', () => {
  const completion = calculateNgoProfileCompletion({})

  assert.equal(completion.completedSections, 0)
  assert.equal(completion.percentage, 0)
  assert.equal(completion.sectionComplete.verification, false)
  assert.equal(completion.sectionComplete.discoverability, false)
})

test('marks verification complete only after submission or approval', () => {
  assert.equal(calculateNgoProfileCompletion({}, { verificationStatus: 'draft' }).sectionComplete.verification, false)
  assert.equal(calculateNgoProfileCompletion({}, { verificationStatus: 'rejected' }).sectionComplete.verification, false)
  assert.equal(calculateNgoProfileCompletion({}, { verificationStatus: 'pending' }).sectionComplete.verification, true)
  assert.equal(calculateNgoProfileCompletion({}, { verificationStatus: 'verified' }).sectionComplete.verification, true)
})

test('keeps published but hidden profiles available only by direct link', () => {
  assert.deepEqual(
    getNgoProfileVisibility({ profileStatus: 'published', isDiscoverable: false }),
    { canViewDirectly: true, includeInDirectory: false }
  )
  assert.deepEqual(
    getNgoProfileVisibility({ profileStatus: 'draft', isDiscoverable: true }),
    { canViewDirectly: false, includeInDirectory: false }
  )
})

test('accepts only supported private verification documents', () => {
  assert.equal(
    validateVerificationDocument({
      name: 'registration.pdf',
      type: 'application/pdf',
      size: 2 * 1024 * 1024,
    }),
    null
  )
  assert.equal(
    validateVerificationDocument({
      name: 'registration.svg',
      type: 'image/svg+xml',
      size: 1024,
    }),
    'Upload a PDF, JPEG, or PNG document.'
  )
  assert.equal(
    validateVerificationDocument({
      name: 'large.pdf',
      type: 'application/pdf',
      size: 11 * 1024 * 1024,
    }),
    'Document size must not exceed 10 MB.'
  )
})
