/**
 * NGO Enhancement Services
 * Handles NGO verification, ratings, and reviews
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { getBrowserClient } from '@/lib/supabase'

// ============================================================================
// TYPES
// ============================================================================

export type VerificationStatus = 'pending' | 'verified' | 'rejected'

export interface NGOVerification {
  id: string
  ngo_id: string
  verification_status: VerificationStatus
  verified_by?: string
  verification_date?: string
  verification_notes?: string
  documents_verified: boolean
  registration_number?: string
  created_at: string
  updated_at: string
}

export interface NGOReview {
  id: string
  ngo_id: string
  user_id: string
  rating: number
  review_text?: string
  donation_id?: string
  is_verified_donor: boolean
  helpful_count: number
  created_at: string
  updated_at: string
}

export interface NGOReviewWithUser extends NGOReview {
  user: {
    id: string
    name: string
  }
}

export interface CreateNGOReviewParams {
  ngoId: string
  rating: number
  reviewText?: string
  donationId?: string
}

export interface SubmitVerificationParams {
  ngoId: string
  registrationNumber?: string
}

export interface VerifyNGOParams {
  verificationId: string
  status: 'verified' | 'rejected'
  notes?: string
}

// ============================================================================
// NGO VERIFICATION FUNCTIONS
// ============================================================================

/**
 * Submit NGO for verification
 */
export async function submitNGOVerification(
  params: SubmitVerificationParams,
  supabaseClient?: SupabaseClient
) {
  const supabase = supabaseClient || getBrowserClient()

  // Check if NGO belongs to current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('You must be logged in')

  const { data: ngo } = await supabase
    .from('ngos')
    .select('user_id')
    .eq('id', params.ngoId)
    .single()

  if (!ngo || ngo.user_id !== user.id) {
    throw new Error('Unauthorized: This NGO does not belong to you')
  }

  // Check if verification already exists
  const { data: existing } = await supabase
    .from('ngo_verifications')
    .select('id, verification_status')
    .eq('ngo_id', params.ngoId)
    .single()

  if (existing && existing.verification_status === 'verified') {
    throw new Error('This NGO is already verified')
  }

  if (existing && existing.verification_status === 'pending') {
    throw new Error('Verification request is already pending')
  }

  // Create verification request
  const { data, error } = await supabase
    .from('ngo_verifications')
    .insert({
      ngo_id: params.ngoId,
      registration_number: params.registrationNumber,
      verification_status: 'pending',
      documents_verified: false
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get verification status for an NGO
 */
export async function getNGOVerification(
  ngoId: string,
  supabaseClient?: SupabaseClient
): Promise<NGOVerification | null> {
  const supabase = supabaseClient || getBrowserClient()

  const { data, error } = await supabase
    .from('ngo_verifications')
    .select('*')
    .eq('ngo_id', ngoId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error) return null
  return data
}

/**
 * Get all pending verification requests (Admin only)
 */
export async function getPendingVerifications(
  supabaseClient?: SupabaseClient
): Promise<NGOVerification[]> {
  const supabase = supabaseClient || getBrowserClient()

  const { data, error } = await supabase
    .from('ngo_verifications')
    .select(`
      *,
      ngo:ngos(id, name, description, category, city, state)
    `)
    .eq('verification_status', 'pending')
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Verify or reject NGO (Admin only)
 */
export async function verifyNGO(
  params: VerifyNGOParams,
  supabaseClient?: SupabaseClient
) {
  const supabase = supabaseClient || getBrowserClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Check if user is admin
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userProfile || userProfile.role !== 'admin') {
    throw new Error('Only admins can verify NGOs')
  }

  // Update verification
  const { data: verification, error: verificationError } = await supabase
    .from('ngo_verifications')
    .update({
      verification_status: params.status,
      verified_by: user.id,
      verification_date: new Date().toISOString(),
      verification_notes: params.notes,
      documents_verified: params.status === 'verified'
    })
    .eq('id', params.verificationId)
    .select()
    .single()

  if (verificationError) throw verificationError

  // Update NGO is_verified status
  if (params.status === 'verified') {
    const { error: ngoError } = await supabase
      .from('ngos')
      .update({ is_verified: true })
      .eq('id', verification.ngo_id)

    if (ngoError) throw ngoError
  }

  return verification
}

// ============================================================================
// NGO REVIEWS & RATINGS FUNCTIONS
// ============================================================================

/**
 * Create a review for an NGO
 */
export async function createNGOReview(
  params: CreateNGOReviewParams,
  supabaseClient?: SupabaseClient
) {
  const supabase = supabaseClient || getBrowserClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('You must be logged in to review')

  // Validate rating
  if (params.rating < 1 || params.rating > 5) {
    throw new Error('Rating must be between 1 and 5')
  }

  // Check if user has donated to this NGO (verified donor)
  const { data: donations } = await supabase
    .from('donations')
    .select('id')
    .eq('user_id', user.id)
    .eq('ngo_id', params.ngoId)
    .limit(1)

  const isVerifiedDonor = donations && donations.length > 0

  // Check if user already reviewed this NGO
  const { data: existing } = await supabase
    .from('ngo_reviews')
    .select('id')
    .eq('user_id', user.id)
    .eq('ngo_id', params.ngoId)
    .single()

  if (existing) {
    throw new Error('You have already reviewed this NGO. You can edit your existing review.')
  }

  // Create review
  const { data, error } = await supabase
    .from('ngo_reviews')
    .insert({
      ngo_id: params.ngoId,
      user_id: user.id,
      rating: params.rating,
      review_text: params.reviewText,
      donation_id: params.donationId,
      is_verified_donor: isVerifiedDonor
    })
    .select()
    .single()

  if (error) throw error

  // Trigger will automatically update NGO average rating
  return data
}

/**
 * Update an existing review
 */
export async function updateNGOReview(
  reviewId: string,
  rating: number,
  reviewText?: string,
  supabaseClient?: SupabaseClient
) {
  const supabase = supabaseClient || getBrowserClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5')
  }

  const { data, error } = await supabase
    .from('ngo_reviews')
    .update({
      rating,
      review_text: reviewText,
      updated_at: new Date().toISOString()
    })
    .eq('id', reviewId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete a review
 */
export async function deleteNGOReview(
  reviewId: string,
  supabaseClient?: SupabaseClient
) {
  const supabase = supabaseClient || getBrowserClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('ngo_reviews')
    .delete()
    .eq('id', reviewId)
    .eq('user_id', user.id)

  if (error) throw error
}

/**
 * Get reviews for an NGO
 */
export async function getNGOReviews(
  ngoId: string,
  limit: number = 10,
  offset: number = 0,
  supabaseClient?: SupabaseClient
): Promise<NGOReviewWithUser[]> {
  const supabase = supabaseClient || getBrowserClient()

  const { data, error } = await supabase
    .from('ngo_reviews')
    .select(`
      *,
      user:users(id, name)
    `)
    .eq('ngo_id', ngoId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return data || []
}

/**
 * Get user's review for a specific NGO
 */
export async function getUserNGOReview(
  ngoId: string,
  supabaseClient?: SupabaseClient
): Promise<NGOReview | null> {
  const supabase = supabaseClient || getBrowserClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('ngo_reviews')
    .select('*')
    .eq('ngo_id', ngoId)
    .eq('user_id', user.id)
    .single()

  if (error) return null
  return data
}

/**
 * Mark review as helpful
 */
export async function markReviewHelpful(
  reviewId: string,
  supabaseClient?: SupabaseClient
) {
  const supabase = supabaseClient || getBrowserClient()

  const { error } = await supabase.rpc('increment_review_helpful', {
    review_id: reviewId
  })

  if (error) throw error
}

/**
 * Get NGO rating summary
 */
export async function getNGORatingSummary(
  ngoId: string,
  supabaseClient?: SupabaseClient
) {
  const supabase = supabaseClient || getBrowserClient()

  // Get rating distribution
  const { data, error } = await supabase
    .from('ngo_reviews')
    .select('rating')
    .eq('ngo_id', ngoId)

  if (error) throw error

  const reviews = data || []
  const totalReviews = reviews.length

  if (totalReviews === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    }
  }

  // Calculate distribution
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  reviews.forEach(review => {
    distribution[review.rating as 1 | 2 | 3 | 4 | 5]++
  })

  // Calculate average
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0)
  const averageRating = Number((sum / totalReviews).toFixed(1))

  return {
    averageRating,
    totalReviews,
    distribution
  }
}

/**
 * Get top-rated NGOs
 */
export async function getTopRatedNGOs(
  limit: number = 10,
  supabaseClient?: SupabaseClient
) {
  const supabase = supabaseClient || getBrowserClient()

  const { data, error } = await supabase
    .from('ngos')
    .select('*')
    .gte('total_reviews', 5) // At least 5 reviews
    .order('average_rating', { ascending: false })
    .order('total_reviews', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

/**
 * Check if user can review NGO
 */
export async function canUserReviewNGO(
  ngoId: string,
  supabaseClient?: SupabaseClient
): Promise<{ canReview: boolean; reason?: string }> {
  const supabase = supabaseClient || getBrowserClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { canReview: false, reason: 'You must be logged in to review' }
  }

  // Check if user owns this NGO
  const { data: ngo } = await supabase
    .from('ngos')
    .select('user_id')
    .eq('id', ngoId)
    .single()

  if (ngo && ngo.user_id === user.id) {
    return { canReview: false, reason: 'You cannot review your own NGO' }
  }

  // Check if already reviewed
  const { data: existing } = await supabase
    .from('ngo_reviews')
    .select('id')
    .eq('user_id', user.id)
    .eq('ngo_id', ngoId)
    .single()

  if (existing) {
    return { canReview: false, reason: 'You have already reviewed this NGO' }
  }

  return { canReview: true }
}
