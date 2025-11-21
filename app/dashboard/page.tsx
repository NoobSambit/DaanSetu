import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { DonationCause } from '@/lib/types/database.types'

export const dynamic = 'force-dynamic'

interface DonationWithNGO {
  id: string
  amount: number
  cause: DonationCause
  is_anonymous: boolean
  created_at: string
  ngos: {
    id: string
    name: string
    category: string
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/auth/login?redirect=/dashboard')
  }

  // Fetch user's donations with NGO details
  const { data: donations, error: donationsError } = await supabase
    .from('donations')
    .select(`
      id,
      amount,
      cause,
      is_anonymous,
      created_at,
      ngos (
        id,
        name,
        category
      )
    `)
    .order('created_at', { ascending: false })

  const donationsList = (donations as unknown as DonationWithNGO[]) || []

  // Calculate stats
  const totalAmount = donationsList.reduce((sum, donation) => sum + donation.amount, 0)
  const totalDonations = donationsList.length

  const causeEmojis: Record<DonationCause, string> = {
    education: '📚',
    hunger: '🍲',
    healthcare: '🏥',
    disaster: '🆘',
    general: '💝',
  }

  const causeLabels: Record<DonationCause, string> = {
    education: 'Education',
    hunger: 'Hunger Relief',
    healthcare: 'Healthcare',
    disaster: 'Disaster Relief',
    general: 'General',
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Dashboard</h1>
          <p className="text-gray-600">Track your donations and impact</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Donated</p>
                <p className="text-3xl font-bold text-blue-600">₹{totalAmount.toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-blue-100 p-4 rounded-full">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Donations</p>
                <p className="text-3xl font-bold text-green-600">{totalDonations}</p>
              </div>
              <div className="bg-green-100 p-4 rounded-full">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Donation History */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">Donation History</h2>
          </div>

          {donationsList.length === 0 ? (
            <div className="p-12 text-center">
              <svg
                className="w-16 h-16 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-lg font-medium text-gray-900 mb-2">No donations yet</p>
              <p className="text-gray-600 mb-6">Start making a difference by supporting NGOs</p>
              <Link
                href="/ngos"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Explore NGOs
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {donationsList.map((donation) => (
                <div key={donation.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Link
                        href={`/ngos/${donation.ngos.id}`}
                        className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition"
                      >
                        {donation.ngos.name}
                      </Link>
                      <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                        <span className="flex items-center">
                          {causeEmojis[donation.cause]} {causeLabels[donation.cause]}
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(donation.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        {donation.is_anonymous && (
                          <>
                            <span>•</span>
                            <span className="text-gray-500 italic">Anonymous</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-xl font-bold text-green-600">
                        ₹{donation.amount.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
