import { createClient } from '@/lib/supabase/client'
import type { VolunteerProfile } from '@/lib/types/database.types'

export interface CreateVolunteerProfileParams {
  bio?: string
  city: string
  skills: string[]
  availability: string[]
}

export interface UpdateVolunteerProfileParams {
  bio?: string
  city?: string
  skills?: string[]
  availability?: string[]
}

// Create a volunteer profile
export async function createVolunteerProfile(params: CreateVolunteerProfileParams) {
  const supabase = createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  const { data, error } = await supabase
    .from('volunteer_profiles')
    .insert({
      user_id: user.id,
      bio: params.bio || null,
      city: params.city,
      skills: params.skills,
      availability: params.availability,
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

// Get volunteer profile by user ID
export async function getVolunteerProfile(userId?: string): Promise<VolunteerProfile | null> {
  const supabase = createClient()

  let targetUserId = userId

  if (!targetUserId) {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return null
    }
    targetUserId = user.id
  }

  const { data, error } = await supabase
    .from('volunteer_profiles')
    .select('*')
    .eq('user_id', targetUserId)
    .single()

  if (error) {
    return null
  }

  return data
}

// Update volunteer profile
export async function updateVolunteerProfile(params: UpdateVolunteerProfileParams) {
  const supabase = createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  const updateData: any = {
    updated_at: new Date().toISOString(),
  }

  if (params.bio !== undefined) updateData.bio = params.bio
  if (params.city !== undefined) updateData.city = params.city
  if (params.skills !== undefined) updateData.skills = params.skills
  if (params.availability !== undefined) updateData.availability = params.availability

  const { data, error } = await supabase
    .from('volunteer_profiles')
    .update(updateData)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

// Check if user has a volunteer profile
export async function hasVolunteerProfile(): Promise<boolean> {
  const profile = await getVolunteerProfile()
  return profile !== null
}

// Available skills options
export const VOLUNTEER_SKILLS = [
  'Teaching',
  'Medical',
  'Event Support',
  'Fundraising',
  'Logistics',
  'Technical',
  'Other',
] as const

// Available availability options
export const VOLUNTEER_AVAILABILITY = [
  'Weekdays',
  'Weekends',
  'Flexible',
] as const
