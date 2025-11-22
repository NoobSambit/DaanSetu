import { getBrowserClient } from '@/lib/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface UserProfile {
  id: string
  user_id: string
  bio: string | null
  avatar_url: string | null
  location: string | null
  website: string | null
  twitter_handle: string | null
  linkedin_url: string | null
  created_at: string
  updated_at: string
}

export interface UserProfileWithUser extends UserProfile {
  user: {
    id: string
    name: string
    email: string
    role: string
  }
}

export interface CreateUserProfileData {
  user_id: string
  bio?: string
  avatar_url?: string
  location?: string
  website?: string
  twitter_handle?: string
  linkedin_url?: string
}

export interface UpdateUserProfileData {
  bio?: string
  avatar_url?: string
  location?: string
  website?: string
  twitter_handle?: string
  linkedin_url?: string
}

export interface UserStats {
  total_donations: number
  donation_count: number
  volunteer_applications: number
  posts_created: number
  comments_made: number
  badges_earned: number
  following_count: number
  follower_count: number
}

// Create user profile
export async function createUserProfile(data: CreateUserProfileData, supabaseClient?: SupabaseClient): Promise<UserProfile> {
  const supabase = supabaseClient || getBrowserClient()

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .insert(data)
    .select()
    .single()

  if (error) {
    console.error('Error creating user profile:', error)
    throw new Error('Failed to create user profile')
  }

  return profile
}

// Get user profile by user ID
export async function getUserProfile(userId: string, supabaseClient?: SupabaseClient): Promise<UserProfileWithUser | null> {
  const supabase = supabaseClient || getBrowserClient()

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select(`
      *,
      user:users!user_profiles_user_id_fkey(id, name, email, role)
    `)
    .eq('user_id', userId)
    .single()

  if (error || !profile) {
    return null
  }

  return {
    ...profile,
    user: Array.isArray(profile.user) ? profile.user[0] : profile.user
  }
}

// Update user profile
export async function updateUserProfile(userId: string, data: UpdateUserProfileData, supabaseClient?: SupabaseClient): Promise<UserProfile> {
  const supabase = supabaseClient || getBrowserClient()

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating user profile:', error)
    throw new Error('Failed to update user profile')
  }

  return profile
}

// Check if user has profile
export async function hasUserProfile(userId: string, supabaseClient?: SupabaseClient): Promise<boolean> {
  const supabase = supabaseClient || getBrowserClient()

  const { data, error } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('user_id', userId)
    .single()

  return !error && !!data
}

// Get user stats using database function
export async function getUserStats(userId: string, supabaseClient?: SupabaseClient): Promise<UserStats> {
  const supabase = supabaseClient || getBrowserClient()

  const { data, error } = await supabase
    .rpc('get_user_stats', { user_uuid: userId })
    .single()

  if (error) {
    console.error('Error getting user stats:', error)
    return {
      total_donations: 0,
      donation_count: 0,
      volunteer_applications: 0,
      posts_created: 0,
      comments_made: 0,
      badges_earned: 0,
      following_count: 0,
      follower_count: 0
    }
  }

  return data
}

// Delete user profile
export async function deleteUserProfile(userId: string, supabaseClient?: SupabaseClient): Promise<void> {
  const supabase = supabaseClient || getBrowserClient()

  const { error } = await supabase
    .from('user_profiles')
    .delete()
    .eq('user_id', userId)

  if (error) {
    console.error('Error deleting user profile:', error)
    throw new Error('Failed to delete user profile')
  }
}
