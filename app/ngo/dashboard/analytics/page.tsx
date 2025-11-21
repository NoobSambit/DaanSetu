import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { getNGOAnalytics, exportNGOReport } from '@/lib/services/analytics'
import DownloadReportButton from './components/DownloadReportButton'

export const dynamic = 'force-dynamic'

export default async function NGOAnalyticsPage() {
  const supabase = await createClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/auth/login?redirect=/ngo/dashboard/analytics')
  }

  // Get user's NGO
  const { data: ngo } = await supabase
    .from('ngos')
    .select('id, name')
    .eq('user_id', user.id)
    .single()

  if (!ngo) {
    redirect('/ngos')
  }

  // Get analytics data
  const analytics = await getNGOAnalytics(ngo.id)

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
            <p className="text-gray-600">{ngo.name}</p>
          </div>
          <DownloadReportButton ngoId={ngo.id} ngoName={ngo.name} />
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Funds Received</p>
                <p className="text-3xl font-bold text-green-600">₹{analytics.totalFunds.toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-green-100 p-4 rounded-full">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Active Campaigns</p>
                <p className="text-3xl font-bold text-blue-600">{analytics.campaigns.length}</p>
              </div>
              <div className="bg-blue-100 p-4 rounded-full">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Volunteer Applications</p>
                <p className="text-3xl font-bold text-purple-600">{analytics.volunteerApplications}</p>
              </div>
              <div className="bg-purple-100 p-4 rounded-full">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Donations Over Time Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Donations Over Time</h2>
          {analytics.donationsTimeSeries.length > 0 ? (
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.donationsTimeSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} name="Amount (₹)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-12">No donation data available yet</p>
          )}
        </div>

        {/* Campaign Performance */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Campaign Performance</h2>
          {analytics.campaigns.length > 0 ? (
            <div className="space-y-4">
              {analytics.campaigns.map((campaign: any) => {
                const progress = Math.min((campaign.current_amount / campaign.goal_amount) * 100, 100)
                return (
                  <div key={campaign.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">{campaign.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                        campaign.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {campaign.status}
                      </span>
                    </div>
                    <div className="mb-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold text-gray-900">
                          ₹{campaign.current_amount.toLocaleString('en-IN')}
                        </span>
                        <span className="text-gray-600">
                          of ₹{campaign.goal_amount.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{progress.toFixed(0)}% funded</p>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-12">No campaigns created yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
