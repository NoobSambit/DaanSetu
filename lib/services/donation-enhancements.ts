/**
 * Donation Enhancement Services
 * Handles recurring donations, tax receipts, and gift cards
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { getBrowserClient } from '@/lib/supabase'

// ============================================================================
// TYPES
// ============================================================================

export type DonationFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
export type RecurringStatus = 'active' | 'paused' | 'cancelled'
export type GiftCardStatus = 'active' | 'redeemed' | 'expired'

export interface RecurringDonation {
  id: string
  user_id: string
  ngo_id: string
  campaign_id?: string
  amount: number
  frequency: DonationFrequency
  cause: string
  is_anonymous: boolean
  status: RecurringStatus
  next_donation_date: string
  last_donation_date?: string
  total_donations_made: number
  created_at: string
  updated_at: string
}

export interface TaxReceipt {
  id: string
  donation_id: string
  user_id: string
  ngo_id: string
  receipt_number: string
  financial_year: string
  amount: number
  tax_exemption_80g: boolean
  pdf_url?: string
  generated_at: string
}

export interface DonationGiftCard {
  id: string
  code: string
  amount: number
  purchased_by?: string
  recipient_email?: string
  recipient_name?: string
  message?: string
  redeemed_by?: string
  redeemed_at?: string
  expires_at: string
  status: GiftCardStatus
  created_at: string
}

export interface CreateRecurringDonationParams {
  ngoId: string
  campaignId?: string
  amount: number
  frequency: DonationFrequency
  cause: string
  isAnonymous?: boolean
}

export interface CreateGiftCardParams {
  amount: number
  recipientEmail?: string
  recipientName?: string
  message?: string
  expiryDays?: number
}

// ============================================================================
// RECURRING DONATIONS
// ============================================================================

/**
 * Create a recurring donation subscription
 */
export async function createRecurringDonation(
  params: CreateRecurringDonationParams,
  supabaseClient?: SupabaseClient
): Promise<RecurringDonation> {
  const supabase = supabaseClient || getBrowserClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('You must be logged in')

  // Validate amount
  if (params.amount <= 0) {
    throw new Error('Amount must be greater than 0')
  }

  if (params.amount < 10) {
    throw new Error('Minimum recurring donation amount is ₹10')
  }

  // Calculate next donation date based on frequency
  const nextDate = calculateNextDonationDate(params.frequency)

  const { data, error } = await supabase
    .from('recurring_donations')
    .insert({
      user_id: user.id,
      ngo_id: params.ngoId,
      campaign_id: params.campaignId,
      amount: params.amount,
      frequency: params.frequency,
      cause: params.cause,
      is_anonymous: params.isAnonymous || false,
      status: 'active',
      next_donation_date: nextDate,
      total_donations_made: 0
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get user's recurring donations
 */
export async function getUserRecurringDonations(
  supabaseClient?: SupabaseClient
): Promise<RecurringDonation[]> {
  const supabase = supabaseClient || getBrowserClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('recurring_donations')
    .select(`
      *,
      ngo:ngos(id, name, category)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Pause a recurring donation
 */
export async function pauseRecurringDonation(
  recurringId: string,
  supabaseClient?: SupabaseClient
) {
  const supabase = supabaseClient || getBrowserClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('recurring_donations')
    .update({ status: 'paused' })
    .eq('id', recurringId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Resume a paused recurring donation
 */
export async function resumeRecurringDonation(
  recurringId: string,
  supabaseClient?: SupabaseClient
) {
  const supabase = supabaseClient || getBrowserClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Recalculate next donation date
  const { data: recurring } = await supabase
    .from('recurring_donations')
    .select('frequency')
    .eq('id', recurringId)
    .single()

  if (!recurring) throw new Error('Recurring donation not found')

  const nextDate = calculateNextDonationDate(recurring.frequency)

  const { data, error } = await supabase
    .from('recurring_donations')
    .update({
      status: 'active',
      next_donation_date: nextDate
    })
    .eq('id', recurringId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Cancel a recurring donation
 */
export async function cancelRecurringDonation(
  recurringId: string,
  supabaseClient?: SupabaseClient
) {
  const supabase = supabaseClient || getBrowserClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('recurring_donations')
    .update({ status: 'cancelled' })
    .eq('id', recurringId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update recurring donation amount
 */
export async function updateRecurringDonationAmount(
  recurringId: string,
  newAmount: number,
  supabaseClient?: SupabaseClient
) {
  const supabase = supabaseClient || getBrowserClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  if (newAmount < 10) {
    throw new Error('Minimum amount is ₹10')
  }

  const { data, error } = await supabase
    .from('recurring_donations')
    .update({ amount: newAmount })
    .eq('id', recurringId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get recurring donations due for processing (System function)
 */
export async function getDueRecurringDonations(
  supabaseClient?: SupabaseClient
): Promise<RecurringDonation[]> {
  const supabase = supabaseClient || getBrowserClient()

  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('recurring_donations')
    .select('*')
    .eq('status', 'active')
    .lte('next_donation_date', today)

  if (error) throw error
  return data || []
}

/**
 * Process recurring donation (System function)
 */
export async function processRecurringDonation(
  recurringId: string,
  supabaseClient?: SupabaseClient
) {
  const supabase = supabaseClient || getBrowserClient()

  // Get recurring donation details
  const { data: recurring } = await supabase
    .from('recurring_donations')
    .select('*')
    .eq('id', recurringId)
    .single()

  if (!recurring) throw new Error('Recurring donation not found')

  // Create actual donation
  const { data: donation, error: donationError } = await supabase
    .from('donations')
    .insert({
      user_id: recurring.user_id,
      ngo_id: recurring.ngo_id,
      campaign_id: recurring.campaign_id,
      amount: recurring.amount,
      cause: recurring.cause,
      is_anonymous: recurring.is_anonymous,
      payment_status: 'completed',
      is_recurring: true,
      recurring_donation_id: recurring.id
    })
    .select()
    .single()

  if (donationError) throw donationError

  // Update recurring donation
  const nextDate = calculateNextDonationDate(recurring.frequency)

  const { error: updateError } = await supabase
    .from('recurring_donations')
    .update({
      last_donation_date: new Date().toISOString().split('T')[0],
      next_donation_date: nextDate,
      total_donations_made: recurring.total_donations_made + 1
    })
    .eq('id', recurringId)

  if (updateError) throw updateError

  // Update campaign if applicable
  if (recurring.campaign_id) {
    await supabase.rpc('increment_campaign_amount', {
      campaign_id: recurring.campaign_id,
      amount_to_add: recurring.amount
    })
  }

  return donation
}

// ============================================================================
// TAX RECEIPTS
// ============================================================================

/**
 * Generate tax receipt for a donation
 */
export async function generateTaxReceipt(
  donationId: string,
  supabaseClient?: SupabaseClient
): Promise<TaxReceipt> {
  const supabase = supabaseClient || getBrowserClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Get donation details
  const { data: donation } = await supabase
    .from('donations')
    .select('*')
    .eq('id', donationId)
    .eq('user_id', user.id)
    .single()

  if (!donation) throw new Error('Donation not found')

  // Check if receipt already exists
  const { data: existing } = await supabase
    .from('tax_receipts')
    .select('id')
    .eq('donation_id', donationId)
    .single()

  if (existing) {
    throw new Error('Tax receipt already generated for this donation')
  }

  // Determine financial year
  const donationDate = new Date(donation.created_at)
  const financialYear = getFinancialYear(donationDate)

  // Create tax receipt
  const { data, error } = await supabase
    .from('tax_receipts')
    .insert({
      donation_id: donationId,
      user_id: user.id,
      ngo_id: donation.ngo_id,
      financial_year: financialYear,
      amount: donation.amount,
      tax_exemption_80g: true
    })
    .select()
    .single()

  if (error) throw error

  return data
}

/**
 * Get user's tax receipts
 */
export async function getUserTaxReceipts(
  financialYear?: string,
  supabaseClient?: SupabaseClient
): Promise<TaxReceipt[]> {
  const supabase = supabaseClient || getBrowserClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  let query = supabase
    .from('tax_receipts')
    .select(`
      *,
      ngo:ngos(id, name)
    `)
    .eq('user_id', user.id)
    .order('generated_at', { ascending: false })

  if (financialYear) {
    query = query.eq('financial_year', financialYear)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

/**
 * Get total tax-deductible donations for a financial year
 */
export async function getTaxDeductibleAmount(
  financialYear: string,
  supabaseClient?: SupabaseClient
): Promise<number> {
  const supabase = supabaseClient || getBrowserClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('tax_receipts')
    .select('amount')
    .eq('user_id', user.id)
    .eq('financial_year', financialYear)
    .eq('tax_exemption_80g', true)

  if (error) throw error

  const total = data?.reduce((sum, receipt) => sum + Number(receipt.amount), 0) || 0
  return total
}

// ============================================================================
// GIFT CARDS
// ============================================================================

/**
 * Create a donation gift card
 */
export async function createDonationGiftCard(
  params: CreateGiftCardParams,
  supabaseClient?: SupabaseClient
): Promise<DonationGiftCard> {
  const supabase = supabaseClient || getBrowserClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('You must be logged in')

  if (params.amount < 10) {
    throw new Error('Minimum gift card amount is ₹10')
  }

  // Generate unique code
  const code = generateGiftCardCode()

  // Calculate expiry date (default 1 year)
  const expiryDays = params.expiryDays || 365
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expiryDays)

  const { data, error } = await supabase
    .from('donation_gift_cards')
    .insert({
      code,
      amount: params.amount,
      purchased_by: user.id,
      recipient_email: params.recipientEmail,
      recipient_name: params.recipientName,
      message: params.message,
      expires_at: expiresAt.toISOString(),
      status: 'active'
    })
    .select()
    .single()

  if (error) throw error

  return data
}

/**
 * Validate gift card code
 */
export async function validateGiftCard(
  code: string,
  supabaseClient?: SupabaseClient
): Promise<{ valid: boolean; giftCard?: DonationGiftCard; reason?: string }> {
  const supabase = supabaseClient || getBrowserClient()

  const { data: giftCard } = await supabase
    .from('donation_gift_cards')
    .select('*')
    .eq('code', code.toUpperCase())
    .single()

  if (!giftCard) {
    return { valid: false, reason: 'Invalid gift card code' }
  }

  if (giftCard.status === 'redeemed') {
    return { valid: false, reason: 'Gift card already redeemed' }
  }

  if (giftCard.status === 'expired') {
    return { valid: false, reason: 'Gift card has expired' }
  }

  if (new Date(giftCard.expires_at) < new Date()) {
    // Update status to expired
    await supabase
      .from('donation_gift_cards')
      .update({ status: 'expired' })
      .eq('id', giftCard.id)

    return { valid: false, reason: 'Gift card has expired' }
  }

  return { valid: true, giftCard }
}

/**
 * Redeem gift card
 */
export async function redeemGiftCard(
  code: string,
  ngoId: string,
  campaignId?: string,
  supabaseClient?: SupabaseClient
) {
  const supabase = supabaseClient || getBrowserClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('You must be logged in')

  // Validate gift card
  const validation = await validateGiftCard(code, supabase)
  if (!validation.valid || !validation.giftCard) {
    throw new Error(validation.reason || 'Invalid gift card')
  }

  const giftCard = validation.giftCard

  // Create donation
  const { data: donation, error: donationError } = await supabase
    .from('donations')
    .insert({
      user_id: user.id,
      ngo_id: ngoId,
      campaign_id: campaignId,
      amount: giftCard.amount,
      cause: 'general',
      is_anonymous: false,
      payment_status: 'completed',
      payment_method: 'gift_card'
    })
    .select()
    .single()

  if (donationError) throw donationError

  // Mark gift card as redeemed
  const { error: updateError } = await supabase
    .from('donation_gift_cards')
    .update({
      status: 'redeemed',
      redeemed_by: user.id,
      redeemed_at: new Date().toISOString()
    })
    .eq('id', giftCard.id)

  if (updateError) throw updateError

  // Update campaign if applicable
  if (campaignId) {
    await supabase.rpc('increment_campaign_amount', {
      campaign_id: campaignId,
      amount_to_add: giftCard.amount
    })
  }

  return donation
}

/**
 * Get user's purchased gift cards
 */
export async function getUserGiftCards(
  supabaseClient?: SupabaseClient
): Promise<DonationGiftCard[]> {
  const supabase = supabaseClient || getBrowserClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('donation_gift_cards')
    .select('*')
    .eq('purchased_by', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate next donation date based on frequency
 */
function calculateNextDonationDate(frequency: DonationFrequency): string {
  const date = new Date()

  switch (frequency) {
    case 'daily':
      date.setDate(date.getDate() + 1)
      break
    case 'weekly':
      date.setDate(date.getDate() + 7)
      break
    case 'monthly':
      date.setMonth(date.getMonth() + 1)
      break
    case 'quarterly':
      date.setMonth(date.getMonth() + 3)
      break
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1)
      break
  }

  return date.toISOString().split('T')[0]
}

/**
 * Get financial year for a date (Apr-Mar in India)
 */
function getFinancialYear(date: Date): string {
  const year = date.getFullYear()
  const month = date.getMonth() + 1 // 1-12

  if (month >= 4) {
    return `${year}-${year + 1}`
  } else {
    return `${year - 1}-${year}`
  }
}

/**
 * Generate unique gift card code
 */
function generateGiftCardCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Excluding ambiguous characters
  let code = ''

  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    if (i < 3) code += '-'
  }

  return code
}

/**
 * Get frequency display text
 */
export function getFrequencyText(frequency: DonationFrequency): string {
  const texts: Record<DonationFrequency, string> = {
    daily: 'Every day',
    weekly: 'Every week',
    monthly: 'Every month',
    quarterly: 'Every 3 months',
    yearly: 'Every year'
  }

  return texts[frequency]
}
