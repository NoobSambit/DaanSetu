/**
 * Volunteer Enhancement Services
 * Handles certificates, hours tracking, and skill verification
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { getBrowserClient } from '@/lib/supabase'

// ============================================================================
// TYPES
// ============================================================================

export interface VolunteerCertificate {
  id: string
  user_id: string
  opportunity_id: string
  ngo_id: string
  certificate_number: string
  hours_completed: number
  issue_date: string
  pdf_url?: string
  verified_by?: string
  created_at: string
}

export interface VolunteerHours {
  id: string
  user_id: string
  opportunity_id: string
  ngo_id: string
  hours: number
  date: string
  description?: string
  verified: boolean
  verified_by?: string
  verified_at?: string
  created_at: string
}

export interface SkillVerification {
  id: string
  user_id: string
  skill: string
  verified_by?: string
  verification_type: 'ngo_endorsement' | 'certificate' | 'peer_review'
  evidence_url?: string
  verified_at: string
}

export interface LogVolunteerHoursParams {
  opportunityId: string
  ngoId: string
  hours: number
  date: string
  description?: string
}

export interface VerifySkillParams {
  userId: string
  skill: string
  verificationType: 'ngo_endorsement' | 'certificate' | 'peer_review'
  evidenceUrl?: string
}

// ============================================================================
// VOLUNTEER CERTIFICATES
// ============================================================================

/**
 * Issue volunteer certificate
 */
export async function issueVolunteerCertificate(
  userId: string,
  opportunityId: string,
  hoursCompleted: number,
  supabaseClient?: SupabaseClient
): Promise<VolunteerCertificate> {
  const supabase = supabaseClient || getBrowserClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Get opportunity details
  const { data: opportunity } = await supabase
    .from('volunteer_opportunities')
    .select('ngo_id')
    .eq('id', opportunityId)
    .single()

  if (!opportunity) throw new Error('Opportunity not found')

  // Verify issuer is NGO owner
  const { data: ngo } = await supabase
    .from('ngos')
    .select('user_id')
    .eq('id', opportunity.ngo_id)
    .single()

  if (!ngo || ngo.user_id !== user.id) {
    throw new Error('Unauthorized: Only NGO owners can issue certificates')
  }

  // Check if certificate already exists
  const { data: existing } = await supabase
    .from('volunteer_certificates')
    .select('id')
    .eq('user_id', userId)
    .eq('opportunity_id', opportunityId)
    .single()

  if (existing) {
    throw new Error('Certificate already issued for this opportunity')
  }

  // Generate certificate number
  const certificateNumber = `VC-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

  // Issue certificate
  const { data, error } = await supabase
    .from('volunteer_certificates')
    .insert({
      user_id: userId,
      opportunity_id: opportunityId,
      ngo_id: opportunity.ngo_id,
      certificate_number: certificateNumber,
      hours_completed: hoursCompleted,
      issue_date: new Date().toISOString().split('T')[0],
      verified_by: user.id
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get user's certificates
 */
export async function getUserCertificates(
  supabaseClient?: SupabaseClient
): Promise<VolunteerCertificate[]> {
  const supabase = supabaseClient || getBrowserClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('volunteer_certificates')
    .select(`
      *,
      opportunity:volunteer_opportunities(title),
      ngo:ngos(name)
    `)
    .eq('user_id', user.id)
    .order('issue_date', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Get certificates issued by NGO
 */
export async function getNGOCertificates(
  ngoId: string,
  supabaseClient?: SupabaseClient
): Promise<VolunteerCertificate[]> {
  const supabase = supabaseClient || getBrowserClient()

  const { data, error } = await supabase
    .from('volunteer_certificates')
    .select(`
      *,
      user:users(name, email),
      opportunity:volunteer_opportunities(title)
    `)
    .eq('ngo_id', ngoId)
    .order('issue_date', { ascending: false })

  if (error) throw error
  return data || []
}

// ============================================================================
// VOLUNTEER HOURS TRACKING
// ============================================================================

/**
 * Log volunteer hours
 */
export async function logVolunteerHours(
  params: LogVolunteerHoursParams,
  supabaseClient?: SupabaseClient
): Promise<VolunteerHours> {
  const supabase = supabaseClient || getBrowserClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  if (params.hours <= 0) {
    throw new Error('Hours must be greater than 0')
  }

  const { data, error } = await supabase
    .from('volunteer_hours')
    .insert({
      user_id: user.id,
      opportunity_id: params.opportunityId,
      ngo_id: params.ngoId,
      hours: params.hours,
      date: params.date,
      description: params.description,
      verified: false
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Verify volunteer hours
 */
export async function verifyVolunteerHours(
  hoursId: string,
  supabaseClient?: SupabaseClient
) {
  const supabase = supabaseClient || getBrowserClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Get hours record
  const { data: hours } = await supabase
    .from('volunteer_hours')
    .select('ngo_id')
    .eq('id', hoursId)
    .single()

  if (!hours) throw new Error('Hours record not found')

  // Verify user is NGO owner
  const { data: ngo } = await supabase
    .from('ngos')
    .select('user_id')
    .eq('id', hours.ngo_id)
    .single()

  if (!ngo || ngo.user_id !== user.id) {
    throw new Error('Unauthorized: Only NGO owners can verify hours')
  }

  const { data, error } = await supabase
    .from('volunteer_hours')
    .update({
      verified: true,
      verified_by: user.id,
      verified_at: new Date().toISOString()
    })
    .eq('id', hoursId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get user's volunteer hours
 */
export async function getUserVolunteerHours(
  verified?: boolean,
  supabaseClient?: SupabaseClient
): Promise<VolunteerHours[]> {
  const supabase = supabaseClient || getBrowserClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  let query = supabase
    .from('volunteer_hours')
    .select(`
      *,
      opportunity:volunteer_opportunities(title),
      ngo:ngos(name)
    `)
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  if (verified !== undefined) {
    query = query.eq('verified', verified)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

/**
 * Get pending hours for NGO verification
 */
export async function getNGOPendingHours(
  ngoId: string,
  supabaseClient?: SupabaseClient
): Promise<VolunteerHours[]> {
  const supabase = supabaseClient || getBrowserClient()

  const { data, error } = await supabase
    .from('volunteer_hours')
    .select(`
      *,
      user:users(name, email),
      opportunity:volunteer_opportunities(title)
    `)
    .eq('ngo_id', ngoId)
    .eq('verified', false)
    .order('date', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Get total volunteer hours for user
 */
export async function getTotalVolunteerHours(
  userId?: string,
  supabaseClient?: SupabaseClient
): Promise<number> {
  const supabase = supabaseClient || getBrowserClient()

  let targetUserId = userId

  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    targetUserId = user.id
  }

  const { data, error } = await supabase
    .from('volunteer_hours')
    .select('hours')
    .eq('user_id', targetUserId!)
    .eq('verified', true)

  if (error) throw error

  const total = data?.reduce((sum, record) => sum + Number(record.hours), 0) || 0
  return total
}

// ============================================================================
// SKILL VERIFICATION
// ============================================================================

/**
 * Verify a volunteer's skill
 */
export async function verifyVolunteerSkill(
  params: VerifySkillParams,
  supabaseClient?: SupabaseClient
): Promise<SkillVerification> {
  const supabase = supabaseClient || getBrowserClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Check if already verified
  const { data: existing } = await supabase
    .from('skill_verifications')
    .select('id')
    .eq('user_id', params.userId)
    .eq('skill', params.skill)
    .eq('verified_by', user.id)
    .single()

  if (existing) {
    throw new Error('You have already verified this skill for this user')
  }

  const { data, error } = await supabase
    .from('skill_verifications')
    .insert({
      user_id: params.userId,
      skill: params.skill,
      verified_by: user.id,
      verification_type: params.verificationType,
      evidence_url: params.evidenceUrl
    })
    .select()
    .single()

  if (error) throw error

  // Update user's verified skills
  await updateVerifiedSkills(params.userId, supabase)

  return data
}

/**
 * Get user's skill verifications
 */
export async function getUserSkillVerifications(
  userId?: string,
  supabaseClient?: SupabaseClient
): Promise<SkillVerification[]> {
  const supabase = supabaseClient || getBrowserClient()

  let targetUserId = userId

  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    targetUserId = user.id
  }

  const { data, error } = await supabase
    .from('skill_verifications')
    .select(`
      *,
      verifier:users!verified_by(name)
    `)
    .eq('user_id', targetUserId!)
    .order('verified_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Update user's verified skills list
 */
async function updateVerifiedSkills(
  userId: string,
  supabaseClient: SupabaseClient
) {
  const { data: verifications } = await supabaseClient
    .from('skill_verifications')
    .select('skill')
    .eq('user_id', userId)

  if (!verifications) return

  // Get unique skills
  const verifiedSkills = [...new Set(verifications.map(v => v.skill))]

  // Update volunteer profile
  await supabaseClient
    .from('volunteer_profiles')
    .update({ verified_skills: verifiedSkills })
    .eq('user_id', userId)
}

/**
 * Get skill verification count
 */
export async function getSkillVerificationCount(
  userId: string,
  skill: string,
  supabaseClient?: SupabaseClient
): Promise<number> {
  const supabase = supabaseClient || getBrowserClient()

  const { data, error } = await supabase
    .from('skill_verifications')
    .select('id')
    .eq('user_id', userId)
    .eq('skill', skill)

  if (error) return 0
  return data?.length || 0
}
