import { getBrowserClient } from '@/lib/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Get platform-wide statistics
 */
export async function getPlatformStats(supabaseClient?: SupabaseClient) {
  const supabase = supabaseClient || getBrowserClient()

  const [ngosResult, campaignsResult, donationsResult, volunteersResult] = await Promise.all([
    supabase.from('ngos').select('id', { count: 'exact', head: true }),
    supabase.from('campaigns').select('id', { count: 'exact', head: true }),
    supabase.from('donations').select('id', { count: 'exact', head: true }),
    supabase.from('volunteer_profiles').select('id', { count: 'exact', head: true }),
  ])

  return {
    totalNGOs: ngosResult.count || 0,
    totalCampaigns: campaignsResult.count || 0,
    totalDonations: donationsResult.count || 0,
    totalVolunteers: volunteersResult.count || 0,
  }
}

/**
 * Get donations over time (for charts)
 */
export async function getDonationsOverTime(supabaseClient?: SupabaseClient) {
  const supabase = supabaseClient || getBrowserClient()

  const { data, error } = await supabase
    .from('donations')
    .select('amount, created_at')
    .order('created_at', { ascending: true })

  if (error) throw error

  // Group by date
  const groupedByDate: Record<string, number> = {}

  data?.forEach((donation) => {
    const date = new Date(donation.created_at).toISOString().split('T')[0]
    if (!groupedByDate[date]) {
      groupedByDate[date] = 0
    }
    groupedByDate[date] += donation.amount
  })

  return Object.entries(groupedByDate).map(([date, amount]) => ({
    date,
    amount,
  }))
}

/**
 * Get campaigns created over time
 */
export async function getCampaignsOverTime(supabaseClient?: SupabaseClient) {
  const supabase = supabaseClient || getBrowserClient()

  const { data, error } = await supabase
    .from('campaigns')
    .select('created_at')
    .order('created_at', { ascending: true })

  if (error) throw error

  // Group by date
  const groupedByDate: Record<string, number> = {}

  data?.forEach((campaign) => {
    const date = new Date(campaign.created_at).toISOString().split('T')[0]
    if (!groupedByDate[date]) {
      groupedByDate[date] = 0
    }
    groupedByDate[date] += 1
  })

  return Object.entries(groupedByDate).map(([date, count]) => ({
    date,
    count,
  }))
}

/**
 * Get volunteer growth over time
 */
export async function getVolunteerGrowth(supabaseClient?: SupabaseClient) {
  const supabase = supabaseClient || getBrowserClient()

  const { data, error } = await supabase
    .from('volunteer_profiles')
    .select('created_at')
    .order('created_at', { ascending: true })

  if (error) throw error

  // Group by date
  const groupedByDate: Record<string, number> = {}
  let cumulative = 0

  data?.forEach((profile) => {
    const date = new Date(profile.created_at).toISOString().split('T')[0]
    cumulative += 1
    groupedByDate[date] = cumulative
  })

  return Object.entries(groupedByDate).map(([date, count]) => ({
    date,
    count,
  }))
}

/**
 * Get NGO-specific analytics
 */
export async function getNGOAnalytics(ngoId: string, supabaseClient?: SupabaseClient) {
  const supabase = supabaseClient || getBrowserClient()

  // Get total funds received
  const { data: donations } = await supabase
    .from('donations')
    .select('amount, created_at')
    .eq('ngo_id', ngoId)

  const totalFunds = donations?.reduce((sum, d) => sum + d.amount, 0) || 0

  // Get donations over time for this NGO
  const donationsOverTime: Record<string, number> = {}
  donations?.forEach((donation) => {
    const date = new Date(donation.created_at).toISOString().split('T')[0]
    if (!donationsOverTime[date]) {
      donationsOverTime[date] = 0
    }
    donationsOverTime[date] += donation.amount
  })

  const donationsTimeSeries = Object.entries(donationsOverTime).map(([date, amount]) => ({
    date,
    amount,
  }))

  // Get campaigns performance
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id, title, goal_amount, current_amount, status')
    .eq('ngo_id', ngoId)

  // Get volunteer applications
  const { data: opportunities } = await supabase
    .from('volunteer_opportunities')
    .select('id')
    .eq('ngo_id', ngoId)

  const opportunityIds = opportunities?.map((o) => o.id) || []

  let volunteerApplications = 0
  if (opportunityIds.length > 0) {
    const { count } = await supabase
      .from('volunteer_applications')
      .select('id', { count: 'exact', head: true })
      .in('opportunity_id', opportunityIds)

    volunteerApplications = count || 0
  }

  return {
    totalFunds,
    donationsTimeSeries,
    campaigns: campaigns || [],
    volunteerApplications,
  }
}

/**
 * Get user impact analytics
 */
export async function getUserImpact(userId: string, supabaseClient?: SupabaseClient) {
  const supabase = supabaseClient || getBrowserClient()

  // Get user donations
  const { data: donations } = await supabase
    .from('donations')
    .select('amount, cause, created_at, campaign_id')
    .eq('user_id', userId)

  const totalDonated = donations?.reduce((sum, d) => sum + d.amount, 0) || 0
  const campaignsSupported = new Set(donations?.map((d) => d.campaign_id).filter(Boolean)).size

  // Donations by cause
  const donationsByCause: Record<string, number> = {}
  donations?.forEach((donation) => {
    if (!donationsByCause[donation.cause]) {
      donationsByCause[donation.cause] = 0
    }
    donationsByCause[donation.cause] += donation.amount
  })

  const causeBreakdown = Object.entries(donationsByCause).map(([cause, amount]) => ({
    cause,
    amount,
  }))

  // Donation history over time
  const donationsOverTime: Record<string, number> = {}
  donations?.forEach((donation) => {
    const date = new Date(donation.created_at).toISOString().split('T')[0]
    if (!donationsOverTime[date]) {
      donationsOverTime[date] = 0
    }
    donationsOverTime[date] += donation.amount
  })

  const donationsTimeSeries = Object.entries(donationsOverTime).map(([date, amount]) => ({
    date,
    amount,
  }))

  // Get volunteer applications
  const { count: volunteerApplications } = await supabase
    .from('volunteer_applications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  return {
    totalDonated,
    campaignsSupported,
    volunteerApplications: volunteerApplications || 0,
    causeBreakdown,
    donationsTimeSeries,
  }
}

/**
 * Get admin analytics
 */
export async function getAdminAnalytics(supabaseClient?: SupabaseClient) {
  const supabase = supabaseClient || getBrowserClient()

  // Donations by region (NGO city/state)
  const { data: donationsWithNGO } = await supabase
    .from('donations')
    .select(`
      amount,
      ngos (city, state)
    `)

  const donationsByRegion: Record<string, number> = {}
  donationsWithNGO?.forEach((donation: any) => {
    const region = donation.ngos?.city || 'Unknown'
    if (!donationsByRegion[region]) {
      donationsByRegion[region] = 0
    }
    donationsByRegion[region] += donation.amount
  })

  const regionData = Object.entries(donationsByRegion)
    .map(([region, amount]) => ({ region, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10)

  // Campaign activity by category
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('category')

  const campaignsByCategory: Record<string, number> = {}
  campaigns?.forEach((campaign) => {
    if (!campaignsByCategory[campaign.category]) {
      campaignsByCategory[campaign.category] = 0
    }
    campaignsByCategory[campaign.category] += 1
  })

  const categoryData = Object.entries(campaignsByCategory).map(([category, count]) => ({
    category,
    count,
  }))

  // Top NGOs by donations
  const { data: topNGOsByDonations } = await supabase
    .from('donations')
    .select(`
      amount,
      ngo_id,
      ngos (name)
    `)

  const ngoTotals: Record<string, { name: string; total: number }> = {}
  topNGOsByDonations?.forEach((donation: any) => {
    const ngoId = donation.ngo_id
    const ngoName = donation.ngos?.name || 'Unknown'
    if (!ngoTotals[ngoId]) {
      ngoTotals[ngoId] = { name: ngoName, total: 0 }
    }
    ngoTotals[ngoId].total += donation.amount
  })

  const topNGOs = Object.entries(ngoTotals)
    .map(([id, data]) => ({ id, name: data.name, total: data.total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)

  // AI Flags summary
  const { count: totalFlags } = await supabase
    .from('ai_flags')
    .select('id', { count: 'exact', head: true })

  const { count: highConfidenceFlags } = await supabase
    .from('ai_flags')
    .select('id', { count: 'exact', head: true })
    .eq('confidence', 'high')

  return {
    donationsByRegion: regionData,
    campaignsByCategory: categoryData,
    topNGOs,
    aiFlags: {
      total: totalFlags || 0,
      highConfidence: highConfidenceFlags || 0,
    },
  }
}

/**
 * Export NGO impact report as CSV data
 */
export async function exportNGOReport(ngoId: string, supabaseClient?: SupabaseClient) {
  const supabase = supabaseClient || getBrowserClient()

  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('title, goal_amount, current_amount, created_at, deadline')
    .eq('ngo_id', ngoId)

  const { data: opportunities } = await supabase
    .from('volunteer_opportunities')
    .select('id, title, created_at')
    .eq('ngo_id', ngoId)

  const reportData = []

  for (const campaign of campaigns || []) {
    reportData.push({
      type: 'Campaign',
      title: campaign.title,
      goal: campaign.goal_amount,
      raised: campaign.current_amount,
      created: new Date(campaign.created_at).toLocaleDateString(),
      deadline: new Date(campaign.deadline).toLocaleDateString(),
    })
  }

  for (const opportunity of opportunities || []) {
    const { count } = await supabase
      .from('volunteer_applications')
      .select('id', { count: 'exact', head: true })
      .eq('opportunity_id', opportunity.id)

    reportData.push({
      type: 'Volunteer Opportunity',
      title: opportunity.title,
      applications: count || 0,
      created: new Date(opportunity.created_at).toLocaleDateString(),
    })
  }

  return reportData
}
