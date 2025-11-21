import { createClient } from '@/lib/supabase/client'
import type { CampaignCategory } from '@/lib/types/database.types'

export interface CreateCampaignParams {
  ngoId: string
  title: string
  shortDescription: string
  description: string
  goalAmount: number
  deadline: string
  imageUrl?: string
  category: CampaignCategory
}

export interface UpdateCampaignParams {
  title?: string
  shortDescription?: string
  description?: string
  goalAmount?: number
  deadline?: string
  imageUrl?: string
  category?: CampaignCategory
  status?: 'active' | 'completed' | 'cancelled'
}

export interface CampaignWithNGO {
  id: string
  ngo_id: string
  title: string
  short_description: string
  description: string
  goal_amount: number
  current_amount: number
  deadline: string
  image_url: string | null
  category: CampaignCategory
  status: string
  created_at: string
  updated_at: string
  ngos: {
    id: string
    name: string
    city: string
    state: string
  }
}

export async function createCampaign(params: CreateCampaignParams) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('campaigns')
    .insert({
      ngo_id: params.ngoId,
      title: params.title,
      short_description: params.shortDescription,
      description: params.description,
      goal_amount: params.goalAmount,
      deadline: params.deadline,
      image_url: params.imageUrl,
      category: params.category,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function updateCampaign(campaignId: string, params: UpdateCampaignParams) {
  const supabase = createClient()

  const updateData: any = {
    updated_at: new Date().toISOString(),
  }

  if (params.title !== undefined) updateData.title = params.title
  if (params.shortDescription !== undefined) updateData.short_description = params.shortDescription
  if (params.description !== undefined) updateData.description = params.description
  if (params.goalAmount !== undefined) updateData.goal_amount = params.goalAmount
  if (params.deadline !== undefined) updateData.deadline = params.deadline
  if (params.imageUrl !== undefined) updateData.image_url = params.imageUrl
  if (params.category !== undefined) updateData.category = params.category
  if (params.status !== undefined) updateData.status = params.status

  const { data, error } = await supabase
    .from('campaigns')
    .update(updateData)
    .eq('id', campaignId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function getCampaign(campaignId: string): Promise<CampaignWithNGO> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('campaigns')
    .select(`
      *,
      ngos (
        id,
        name,
        city,
        state
      )
    `)
    .eq('id', campaignId)
    .single()

  if (error) {
    throw error
  }

  return data as unknown as CampaignWithNGO
}

export async function getAllCampaigns(filters?: {
  category?: CampaignCategory
  sortBy?: 'deadline' | 'created_at' | 'current_amount'
  status?: 'active' | 'completed' | 'cancelled'
}): Promise<CampaignWithNGO[]> {
  const supabase = createClient()

  let query = supabase
    .from('campaigns')
    .select(`
      *,
      ngos (
        id,
        name,
        city,
        state
      )
    `)

  // Apply filters
  if (filters?.category) {
    query = query.eq('category', filters.category)
  }

  if (filters?.status) {
    query = query.eq('status', filters.status)
  } else {
    // By default, only show active campaigns
    query = query.eq('status', 'active')
  }

  // Apply sorting
  if (filters?.sortBy === 'deadline') {
    query = query.order('deadline', { ascending: true })
  } else if (filters?.sortBy === 'current_amount') {
    query = query.order('current_amount', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return data as unknown as CampaignWithNGO[]
}

export async function getNGOCampaigns(ngoId: string): Promise<CampaignWithNGO[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('campaigns')
    .select(`
      *,
      ngos (
        id,
        name,
        city,
        state
      )
    `)
    .eq('ngo_id', ngoId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data as unknown as CampaignWithNGO[]
}

export async function incrementCampaignAmount(campaignId: string, amount: number) {
  const supabase = createClient()

  // Get current amount
  const { data: campaign, error: fetchError } = await supabase
    .from('campaigns')
    .select('current_amount')
    .eq('id', campaignId)
    .single()

  if (fetchError) {
    throw fetchError
  }

  // Update with new amount
  const newAmount = campaign.current_amount + amount

  const { error: updateError } = await supabase
    .from('campaigns')
    .update({
      current_amount: newAmount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', campaignId)

  if (updateError) {
    throw updateError
  }
}

export async function createCampaignUpdate(campaignId: string, text: string, imageUrl?: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('campaign_updates')
    .insert({
      campaign_id: campaignId,
      text,
      image_url: imageUrl,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function getCampaignUpdates(campaignId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('campaign_updates')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data
}

export async function getCampaignDonors(campaignId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('donations')
    .select(`
      id,
      amount,
      is_anonymous,
      created_at,
      users (
        name
      )
    `)
    .eq('campaign_id', campaignId)
    .eq('payment_status', 'completed')
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data
}
