'use client'

import { useState, useEffect } from 'react'
import { getCampaignDonors } from '@/lib/services/campaigns'

interface Donor {
  id: string
  amount: number
  is_anonymous: boolean
  created_at: string
  users: {
    name: string
  } | null
}

export default function CampaignDonors({ campaignId }: { campaignId: string }) {
  const [donors, setDonors] = useState<Donor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDonors()
  }, [campaignId])

  const loadDonors = async () => {
    try {
      const data = await getCampaignDonors(campaignId)
      setDonors(data as any)
    } catch (error) {
      console.error('Failed to load donors:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">
        Supporters ({donors.length})
      </h3>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : donors.length === 0 ? (
        <p className="text-gray-600 text-center py-8">
          No donations yet. Be the first to support!
        </p>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {donors.map((donor) => (
            <div key={donor.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
              <div>
                <p className="font-semibold text-gray-900">
                  {donor.is_anonymous ? 'Anonymous' : donor.users?.name || 'Anonymous'}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(donor.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <p className="text-lg font-bold text-green-600">
                ₹{donor.amount.toLocaleString('en-IN')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
