import { getBrowserClient } from '@/lib/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { CorporateCampaign, CorporateCampaignCause, CorporateCampaignStatus } from '@/lib/types/database.types'

export interface CreateCorporateCampaignParams {
  corporateId: string
  title: string
  description: string
  cause: CorporateCampaignCause
  goalAmount: number
  deadline: string
  imageUrl?: string
}

export interface UpdateCorporateCampaignParams {
  campaignId: string
  title?: string
  description?: string
  cause?: CorporateCampaignCause
  goalAmount?: number
  deadline?: string
  imageUrl?: string
  status?: CorporateCampaignStatus
}

export interface CorporateCampaignWithProfile extends CorporateCampaign {
  corporate_profile: {
    id: string
    company_name: string
    industry: string
    logo_url: string | null
  }
}

export async function createCorporateCampaign(params: CreateCorporateCampaignParams, supabaseClient?: SupabaseClient) {
  const supabase = supabaseClient || getBrowserClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('You must be logged in to create a campaign')
  }

  const { data, error } = await supabase
    .from('corporate_campaigns')
    .insert({
      corporate_id: params.corporateId,
      title: params.title,
      description: params.description,
      cause: params.cause,
      goal_amount: params.goalAmount,
      deadline: params.deadline,
      image_url: params.imageUrl || null,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function getCorporateCampaigns(
  filters?: {
    cause?: CorporateCampaignCause
    status?: CorporateCampaignStatus
  },
  supabaseClient?: SupabaseClient
): Promise<CorporateCampaignWithProfile[]> {
  const supabase = supabaseClient || getBrowserClient()

  let query = supabase
    .from('corporate_campaigns')
    .select(`
      *,
      corporate_profile:corporate_profiles!corporate_campaigns_corporate_id_fkey(
        id,
        company_name,
        industry,
        logo_url
      )
    `)

  if (filters?.cause) {
    query = query.eq('cause', filters.cause)
  }

  if (filters?.status) {
    query = query.eq('status', filters.status)
  } else {
    query = query.eq('status', 'active')
  }

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query

  if (error) {
    throw error
  }

  return data as unknown as CorporateCampaignWithProfile[]
}

export async function getCorporateCampaign(campaignId: string, supabaseClient?: SupabaseClient): Promise<CorporateCampaignWithProfile | null> {
  const supabase = supabaseClient || getBrowserClient()

  const { data, error } = await supabase
    .from('corporate_campaigns')
    .select(`
      *,
      corporate_profile:corporate_profiles!corporate_campaigns_corporate_id_fkey(
        id,
        company_name,
        industry,
        logo_url,
        website
      )
    `)
    .eq('id', campaignId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw error
  }

  return data as unknown as CorporateCampaignWithProfile
}

export async function getCorporateCampaignsByCorporate(corporateId: string, supabaseClient?: SupabaseClient): Promise<CorporateCampaign[]> {
  const supabase = supabaseClient || getBrowserClient()

  const { data, error } = await supabase
    .from('corporate_campaigns')
    .select('*')
    .eq('corporate_id', corporateId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data
}

export async function updateCorporateCampaign(params: UpdateCorporateCampaignParams, supabaseClient?: SupabaseClient) {
  const supabase = supabaseClient || getBrowserClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('You must be logged in to update a campaign')
  }

  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  }

  if (params.title) updateData.title = params.title
  if (params.description) updateData.description = params.description
  if (params.cause) updateData.cause = params.cause
  if (params.goalAmount) updateData.goal_amount = params.goalAmount
  if (params.deadline) updateData.deadline = params.deadline
  if (params.imageUrl !== undefined) updateData.image_url = params.imageUrl
  if (params.status) updateData.status = params.status

  const { data, error } = await supabase
    .from('corporate_campaigns')
    .update(updateData)
    .eq('id', params.campaignId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function incrementCorporateCampaignAmount(campaignId: string, amount: number, supabaseClient?: SupabaseClient) {
  const supabase = supabaseClient || getBrowserClient()

  const { data: campaign, error: fetchError } = await supabase
    .from('corporate_campaigns')
    .select('current_amount')
    .eq('id', campaignId)
    .single()

  if (fetchError) {
    throw fetchError
  }

  const newAmount = Number(campaign.current_amount) + amount

  const { data, error } = await supabase
    .from('corporate_campaigns')
    .update({ current_amount: newAmount })
    .eq('id', campaignId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export const CORPORATE_CAMPAIGN_CAUSES: CorporateCampaignCause[] = [
  'education',
  'food',
  'health',
  'disaster',
  'women',
  'animals',
  'environment',
]
