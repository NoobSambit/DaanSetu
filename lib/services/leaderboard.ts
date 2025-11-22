import { createClient } from '@/lib/supabase/server'

export interface DonorLeaderboardEntry {
  user_id: string
  user_name: string
  user_email: string
  total_donated: number
  donation_count: number
  rank: number
}

export interface VolunteerLeaderboardEntry {
  user_id: string
  user_name: string
  user_email: string
  accepted_count: number
  rank: number
}

export interface NGOLeaderboardEntry {
  ngo_id: string
  ngo_name: string
  ngo_category: string
  total_received: number
  donor_count: number
  rank: number
}

export interface CorporateLeaderboardEntry {
  corporate_id: string
  company_name: string
  industry: string
  total_contributed: number
  campaign_count: number
  rank: number
}

// Get top donors
export async function getTopDonors(limit = 10): Promise<DonorLeaderboardEntry[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('donations')
    .select(`
      user_id,
      amount,
      users!donations_user_id_fkey(name, email)
    `)
    .eq('payment_status', 'completed')

  if (error) {
    console.error('Error fetching donor leaderboard:', error)
    return []
  }

  // Aggregate donations by user
  const donorMap = new Map<string, {
    user_id: string
    user_name: string
    user_email: string
    total_donated: number
    donation_count: number
  }>()

  data.forEach((donation: any) => {
    const userId = donation.user_id
    const user = Array.isArray(donation.users) ? donation.users[0] : donation.users

    if (!donorMap.has(userId)) {
      donorMap.set(userId, {
        user_id: userId,
        user_name: user?.name || 'Anonymous',
        user_email: user?.email || '',
        total_donated: 0,
        donation_count: 0
      })
    }

    const entry = donorMap.get(userId)!
    entry.total_donated += Number(donation.amount)
    entry.donation_count += 1
  })

  // Convert to array and sort
  const donors = Array.from(donorMap.values())
    .sort((a, b) => b.total_donated - a.total_donated)
    .slice(0, limit)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1
    }))

  return donors
}

// Get top volunteers
export async function getTopVolunteers(limit = 10): Promise<VolunteerLeaderboardEntry[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('volunteer_applications')
    .select(`
      user_id,
      status,
      users!volunteer_applications_user_id_fkey(name, email)
    `)
    .eq('status', 'accepted')

  if (error) {
    console.error('Error fetching volunteer leaderboard:', error)
    return []
  }

  // Aggregate applications by user
  const volunteerMap = new Map<string, {
    user_id: string
    user_name: string
    user_email: string
    accepted_count: number
  }>()

  data.forEach((application: any) => {
    const userId = application.user_id
    const user = Array.isArray(application.users) ? application.users[0] : application.users

    if (!volunteerMap.has(userId)) {
      volunteerMap.set(userId, {
        user_id: userId,
        user_name: user?.name || 'Unknown',
        user_email: user?.email || '',
        accepted_count: 0
      })
    }

    const entry = volunteerMap.get(userId)!
    entry.accepted_count += 1
  })

  // Convert to array and sort
  const volunteers = Array.from(volunteerMap.values())
    .sort((a, b) => b.accepted_count - a.accepted_count)
    .slice(0, limit)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1
    }))

  return volunteers
}

// Get top NGOs
export async function getTopNGOs(limit = 10): Promise<NGOLeaderboardEntry[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('donations')
    .select(`
      ngo_id,
      amount,
      user_id,
      ngos!donations_ngo_id_fkey(name, category)
    `)
    .eq('payment_status', 'completed')

  if (error) {
    console.error('Error fetching NGO leaderboard:', error)
    return []
  }

  // Aggregate donations by NGO
  const ngoMap = new Map<string, {
    ngo_id: string
    ngo_name: string
    ngo_category: string
    total_received: number
    donor_count: number
    donors: Set<string>
  }>()

  data.forEach((donation: any) => {
    const ngoId = donation.ngo_id
    const ngo = Array.isArray(donation.ngos) ? donation.ngos[0] : donation.ngos

    if (!ngoMap.has(ngoId)) {
      ngoMap.set(ngoId, {
        ngo_id: ngoId,
        ngo_name: ngo?.name || 'Unknown NGO',
        ngo_category: ngo?.category || 'general',
        total_received: 0,
        donor_count: 0,
        donors: new Set()
      })
    }

    const entry = ngoMap.get(ngoId)!
    entry.total_received += Number(donation.amount)
    entry.donors.add(donation.user_id)
  })

  // Convert to array and sort
  const ngos = Array.from(ngoMap.values())
    .map(({ donors, ...rest }) => ({
      ...rest,
      donor_count: donors.size
    }))
    .sort((a, b) => b.total_received - a.total_received)
    .slice(0, limit)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1
    }))

  return ngos
}

// Get top corporates
export async function getTopCorporates(limit = 10): Promise<CorporateLeaderboardEntry[]> {
  const supabase = await createClient()

  // Get all corporate campaigns with their profiles
  const { data: campaigns, error: campaignsError } = await supabase
    .from('corporate_campaigns')
    .select(`
      id,
      corporate_id,
      current_amount,
      corporate_profiles!corporate_campaigns_corporate_id_fkey(company_name, industry)
    `)

  if (campaignsError) {
    console.error('Error fetching corporate leaderboard:', campaignsError)
    return []
  }

  // Aggregate by corporate
  const corporateMap = new Map<string, {
    corporate_id: string
    company_name: string
    industry: string
    total_contributed: number
    campaign_count: number
  }>()

  campaigns.forEach((campaign: any) => {
    const corporateId = campaign.corporate_id
    const profile = Array.isArray(campaign.corporate_profiles)
      ? campaign.corporate_profiles[0]
      : campaign.corporate_profiles

    if (!corporateMap.has(corporateId)) {
      corporateMap.set(corporateId, {
        corporate_id: corporateId,
        company_name: profile?.company_name || 'Unknown Company',
        industry: profile?.industry || 'Other',
        total_contributed: 0,
        campaign_count: 0
      })
    }

    const entry = corporateMap.get(corporateId)!
    entry.total_contributed += Number(campaign.current_amount)
    entry.campaign_count += 1
  })

  // Convert to array and sort
  const corporates = Array.from(corporateMap.values())
    .sort((a, b) => b.total_contributed - a.total_contributed)
    .slice(0, limit)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1
    }))

  return corporates
}

// Get user's rank in donor leaderboard
export async function getUserDonorRank(userId: string): Promise<number | null> {
  const donors = await getTopDonors(1000) // Get more entries to find user's rank
  const userEntry = donors.find(d => d.user_id === userId)
  return userEntry ? userEntry.rank : null
}

// Get user's rank in volunteer leaderboard
export async function getUserVolunteerRank(userId: string): Promise<number | null> {
  const volunteers = await getTopVolunteers(1000)
  const userEntry = volunteers.find(v => v.user_id === userId)
  return userEntry ? userEntry.rank : null
}
