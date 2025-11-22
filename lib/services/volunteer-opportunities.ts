import { getBrowserClient } from '@/lib/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { VolunteerOpportunity, VolunteerApplication } from '@/lib/types/database.types'

export interface CreateOpportunityParams {
  ngoId: string
  title: string
  description: string
  city: string
  requiredSkills: string[]
  date: string
  totalNeeded: number
}

export interface OpportunityWithNGO extends VolunteerOpportunity {
  ngo: {
    id: string
    name: string
    city: string
  }
}

export interface ApplicationWithDetails extends VolunteerApplication {
  user: {
    id: string
    name: string
    email: string
  }
  volunteer_profile: {
    bio: string | null
    city: string
    skills: string[]
    availability: string[]
  } | null
}

export interface OpportunityFilters {
  skill?: string
  city?: string
  fromDate?: string
}

// Create a volunteer opportunity
export async function createVolunteerOpportunity(params: CreateOpportunityParams, supabaseClient?: SupabaseClient) {
  const supabase = supabaseClient || getBrowserClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  // Verify user owns the NGO
  const { data: ngo, error: ngoError } = await supabase
    .from('ngos')
    .select('*')
    .eq('id', params.ngoId)
    .eq('user_id', user.id)
    .single()

  if (ngoError || !ngo) {
    throw new Error('You do not have permission to create opportunities for this NGO')
  }

  const { data, error } = await supabase
    .from('volunteer_opportunities')
    .insert({
      ngo_id: params.ngoId,
      title: params.title,
      description: params.description,
      city: params.city,
      required_skills: params.requiredSkills,
      date: params.date,
      total_needed: params.totalNeeded,
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

// Get all volunteer opportunities with filters
export async function getVolunteerOpportunities(
  filters?: OpportunityFilters,
  supabaseClient?: SupabaseClient
): Promise<OpportunityWithNGO[]> {
  const supabase = supabaseClient || getBrowserClient()

  let query = supabase
    .from('volunteer_opportunities')
    .select(`
      *,
      ngo:ngos(id, name, city)
    `)
    .eq('status', 'active')
    .order('date', { ascending: true })

  if (filters?.skill) {
    query = query.contains('required_skills', [filters.skill])
  }

  if (filters?.city) {
    query = query.eq('city', filters.city)
  }

  if (filters?.fromDate) {
    query = query.gte('date', filters.fromDate)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  return data as OpportunityWithNGO[]
}

// Get a single volunteer opportunity
export async function getVolunteerOpportunity(id: string, supabaseClient?: SupabaseClient): Promise<OpportunityWithNGO | null> {
  const supabase = supabaseClient || getBrowserClient()

  const { data, error } = await supabase
    .from('volunteer_opportunities')
    .select(`
      *,
      ngo:ngos(id, name, city)
    `)
    .eq('id', id)
    .single()

  if (error) {
    return null
  }

  return data as OpportunityWithNGO
}

// Get opportunities for a specific NGO
export async function getNGOOpportunities(ngoId: string, supabaseClient?: SupabaseClient): Promise<VolunteerOpportunity[]> {
  const supabase = supabaseClient || getBrowserClient()

  const { data, error } = await supabase
    .from('volunteer_opportunities')
    .select('*')
    .eq('ngo_id', ngoId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

// Apply to a volunteer opportunity
export async function applyToOpportunity(opportunityId: string, supabaseClient?: SupabaseClient) {
  const supabase = supabaseClient || getBrowserClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  // Check if already applied
  const { data: existing } = await supabase
    .from('volunteer_applications')
    .select('*')
    .eq('opportunity_id', opportunityId)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    throw new Error('You have already applied to this opportunity')
  }

  const { data, error } = await supabase
    .from('volunteer_applications')
    .insert({
      opportunity_id: opportunityId,
      user_id: user.id,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

// Check if user has applied to an opportunity
export async function hasApplied(opportunityId: string, supabaseClient?: SupabaseClient): Promise<boolean> {
  const supabase = supabaseClient || getBrowserClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return false
  }

  const { data } = await supabase
    .from('volunteer_applications')
    .select('id')
    .eq('opportunity_id', opportunityId)
    .eq('user_id', user.id)
    .single()

  return !!data
}

// Get applications for a specific opportunity
export async function getOpportunityApplications(
  opportunityId: string,
  supabaseClient?: SupabaseClient
): Promise<ApplicationWithDetails[]> {
  const supabase = supabaseClient || getBrowserClient()

  const { data, error } = await supabase
    .from('volunteer_applications')
    .select(`
      *,
      user:users(id, name, email),
      volunteer_profile:volunteer_profiles(bio, city, skills, availability)
    `)
    .eq('opportunity_id', opportunityId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data as ApplicationWithDetails[]
}

// Get user's applications
export async function getUserApplications(supabaseClient?: SupabaseClient): Promise<Array<VolunteerApplication & { opportunity: OpportunityWithNGO }>> {
  const supabase = supabaseClient || getBrowserClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  const { data, error } = await supabase
    .from('volunteer_applications')
    .select(`
      *,
      opportunity:volunteer_opportunities(
        *,
        ngo:ngos(id, name, city)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data as Array<VolunteerApplication & { opportunity: OpportunityWithNGO }>
}

// Update application status (NGO only)
export async function updateApplicationStatus(
  applicationId: string,
  status: 'accepted' | 'rejected',
  supabaseClient?: SupabaseClient
) {
  const supabase = supabaseClient || getBrowserClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  // Verify user owns the NGO for this opportunity
  const { data: application } = await supabase
    .from('volunteer_applications')
    .select(`
      *,
      opportunity:volunteer_opportunities(
        ngo_id,
        ngo:ngos(user_id)
      )
    `)
    .eq('id', applicationId)
    .single()

  if (!application) {
    throw new Error('Application not found')
  }

  const opportunity = application.opportunity as any
  if (opportunity?.ngo?.user_id !== user.id) {
    throw new Error('You do not have permission to update this application')
  }

  const { data, error } = await supabase
    .from('volunteer_applications')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', applicationId)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

// Get all cities from opportunities
export async function getOpportunityCities(supabaseClient?: SupabaseClient): Promise<string[]> {
  const supabase = supabaseClient || getBrowserClient()

  const { data, error } = await supabase
    .from('volunteer_opportunities')
    .select('city')
    .eq('status', 'active')

  if (error) {
    return []
  }

  const cities = [...new Set(data.map((item) => item.city))].sort()
  return cities
}
