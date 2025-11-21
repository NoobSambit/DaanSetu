import { createClient } from '@/lib/supabase/client'
import type { DonationCause } from '@/lib/types/database.types'
import { incrementCampaignAmount } from './campaigns'

export interface CreateDonationParams {
  ngoId: string
  amount: number
  cause: DonationCause
  isAnonymous: boolean
  campaignId?: string
}

export interface DonationWithNGO {
  id: string
  amount: number
  cause: DonationCause
  is_anonymous: boolean
  created_at: string
  ngo: {
    id: string
    name: string
    category: string
  }
}

// Simulated payment processing
export async function processPayment(amount: number): Promise<{ success: boolean; error?: string }> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Simulate 95% success rate
  const success = Math.random() > 0.05

  if (success) {
    return { success: true }
  } else {
    return {
      success: false,
      error: 'Payment failed. Please try again.'
    }
  }
}

export async function createDonation(params: CreateDonationParams) {
  const supabase = createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('You must be logged in to donate')
  }

  // Process payment
  const paymentResult = await processPayment(params.amount)

  if (!paymentResult.success) {
    throw new Error(paymentResult.error)
  }

  // Create donation record
  const { data, error } = await supabase
    .from('donations')
    .insert({
      user_id: user.id,
      ngo_id: params.ngoId,
      campaign_id: params.campaignId || null,
      amount: params.amount,
      cause: params.cause,
      is_anonymous: params.isAnonymous,
      payment_status: 'completed',
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  // If this donation is for a campaign, increment the campaign amount
  if (params.campaignId) {
    try {
      await incrementCampaignAmount(params.campaignId, params.amount)
    } catch (campaignError) {
      console.error('Failed to update campaign amount:', campaignError)
      // Don't throw - donation was successful
    }
  }

  return data
}

export async function getUserDonations(): Promise<DonationWithNGO[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('donations')
    .select(`
      id,
      amount,
      cause,
      is_anonymous,
      created_at,
      ngo:ngos(id, name, category)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data as unknown as DonationWithNGO[]
}

export async function getDonationStats() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('donations')
    .select('amount')

  if (error) {
    throw error
  }

  const totalAmount = data.reduce((sum, donation) => sum + donation.amount, 0)
  const totalDonations = data.length

  return {
    totalAmount,
    totalDonations,
  }
}
