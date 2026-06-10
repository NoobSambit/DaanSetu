'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getCorporateCampaigns } from '@/lib/services/corporate-campaigns'
import { createPartnershipRequest, hasAppliedForPartnership } from '@/lib/services/partnerships'
import { createClient } from '@/lib/supabase/client'
import type { CorporateCampaignWithProfile } from '@/lib/services/corporate-campaigns'
import type { CorporateCampaignCause } from '@/lib/types/database.types'

export default function CSRCampaignsPage() {
  const [loading, setLoading] = useState(true)
  const [campaigns, setCampaigns] = useState<CorporateCampaignWithProfile[]>([])
  const [userNgoId, setUserNgoId] = useState<string | null>(null)
  const [appliedCampaigns, setAppliedCampaigns] = useState<Set<string>>(new Set())
  const [causeFilter, setCauseFilter] = useState<CorporateCampaignCause | ''>('')
  const [applyingTo, setApplyingTo] = useState<string | null>(null)

  useEffect(() => {
    loadCampaigns()
  }, [causeFilter])

  async function loadCampaigns() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      let ngoId = null
      if (user) {
        const { data: ngoData } = await supabase
          .from('ngos')
          .select('id')
          .eq('user_id', user.id)
          .eq('profile_status', 'published')
          .single()

        if (ngoData) {
          ngoId = ngoData.id
          setUserNgoId(ngoId)
        }
      }

      const campaignsData = await getCorporateCampaigns(
        causeFilter ? { cause: causeFilter } : undefined
      )
      setCampaigns(campaignsData)

      if (ngoId) {
        const applied = new Set<string>()
        for (const campaign of campaignsData) {
          const hasApplied = await hasAppliedForPartnership(campaign.id, ngoId)
          if (hasApplied) {
            applied.add(campaign.id)
          }
        }
        setAppliedCampaigns(applied)
      }
    } catch (error) {
      console.error('Error loading campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleApply(campaignId: string) {
    if (!userNgoId) {
      alert('Only NGOs can apply for partnerships')
      return
    }

    const message = prompt('Enter a message for the corporate (optional):')
    if (message === null) return

    setApplyingTo(campaignId)
    try {
      await createPartnershipRequest({
        corporateCampaignId: campaignId,
        ngoId: userNgoId,
        message: message || undefined,
      })

      setAppliedCampaigns(new Set([...appliedCampaigns, campaignId]))
      alert('Partnership request submitted successfully!')
    } catch (error: any) {
      alert(error.message)
    } finally {
      setApplyingTo(null)
    }
  }

  function getProgress(campaign: CorporateCampaignWithProfile) {
    return Math.min(100, (Number(campaign.current_amount) / Number(campaign.goal_amount)) * 100)
  }

  function getDaysRemaining(deadline: string) {
    const diff = new Date(deadline).getTime() - new Date().getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading CSR campaigns...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Corporate CSR Campaigns</h1>
          <p className="text-gray-600 mt-1">
            Discover and partner with corporate social responsibility initiatives
          </p>
        </div>

        <div className="mb-6">
          <label htmlFor="causeFilter" className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Cause
          </label>
          <select
            id="causeFilter"
            value={causeFilter}
            onChange={(e) => setCauseFilter(e.target.value as CorporateCampaignCause | '')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Causes</option>
            <option value="education">Education</option>
            <option value="food">Food</option>
            <option value="health">Health</option>
            <option value="disaster">Disaster Relief</option>
            <option value="women">Women Empowerment</option>
            <option value="animals">Animal Welfare</option>
            <option value="environment">Environment</option>
          </select>
        </div>

        {campaigns.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No campaigns found</h2>
            <p className="text-gray-600">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition"
              >
                {campaign.image_url && (
                  <img
                    src={campaign.image_url}
                    alt={campaign.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                      {campaign.cause}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{campaign.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">by {campaign.corporate_profile.company_name}</p>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{campaign.description}</p>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium text-gray-900">{getProgress(campaign).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${getProgress(campaign)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm mb-4">
                    <div>
                      <p className="text-gray-600">Raised</p>
                      <p className="font-semibold text-gray-900">
                        ₹{Number(campaign.current_amount).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-600">Goal</p>
                      <p className="font-semibold text-gray-900">
                        ₹{Number(campaign.goal_amount).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <p className="text-sm text-gray-600">
                      {getDaysRemaining(campaign.deadline) > 0
                        ? `${getDaysRemaining(campaign.deadline)} days remaining`
                        : 'Campaign ended'}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/corporate/campaigns/${campaign.id}`}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-center font-medium text-gray-700 hover:bg-gray-50"
                    >
                      View Details
                    </Link>
                    {userNgoId && campaign.status === 'active' && (
                      <button
                        onClick={() => handleApply(campaign.id)}
                        disabled={appliedCampaigns.has(campaign.id) || applyingTo === campaign.id}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium ${
                          appliedCampaigns.has(campaign.id)
                            ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {applyingTo === campaign.id
                          ? 'Applying...'
                          : appliedCampaigns.has(campaign.id)
                          ? 'Applied'
                          : 'Apply'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
