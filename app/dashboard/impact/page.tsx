import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { getUserImpact } from '@/lib/services/analytics'

export const dynamic = 'force-dynamic'

export default async function UserImpactPage() {
  const supabase = await createClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/auth/login?redirect=/dashboard/impact')
  }

  // Get user impact data
  const impact = await getUserImpact(user.id)

  const causeColors: Record<string, string> = {
    education: '#3b82f6',
    hunger: '#f97316',
    healthcare: '#ef4444',
    disaster: '#eab308',
    general: '#8b5cf6',
  }

  const causeLabels: Record<string, string> = {
    education: 'Education',
    hunger: 'Hunger Relief',
    healthcare: 'Healthcare',
    disaster: 'Disaster Relief',
    general: 'General',
  }

  const pieData = impact.causeBreakdown.map((item) => ({
    name: causeLabels[item.cause] || item.cause,
    value: item.amount,
    color: causeColors[item.cause] || '#6b7280',
  }))

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Impact Dashboard</h1>
          <p className="text-gray-600">Track your contributions and see the difference you&apos;re making</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Donated</p>
                <p className="text-3xl font-bold text-green-600">₹{impact.totalDonated.toLocaleString('en-IN')}</p>
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
                <p className="text-sm font-medium text-gray-600 mb-1">Campaigns Supported</p>
                <p className="text-3xl font-bold text-blue-600">{impact.campaignsSupported}</p>
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
                <p className="text-3xl font-bold text-purple-600">{impact.volunteerApplications}</p>
              </div>
              <div className="bg-purple-100 p-4 rounded-full">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Donation History */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Donation History</h2>
            {impact.donationsTimeSeries.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={impact.donationsTimeSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} name="Amount (₹)" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-12">No donation history yet</p>
            )}
          </div>

          {/* Causes Supported */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Causes Supported</h2>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ₹${entry.value.toLocaleString('en-IN')}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-12">No donation data yet</p>
            )}
          </div>
        </div>

        {/* Cause Breakdown Table */}
        {impact.causeBreakdown.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Impact by Cause</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Cause</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Amount Donated</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {impact.causeBreakdown.map((item) => {
                    const percentage = ((item.amount / impact.totalDonated) * 100).toFixed(1)
                    return (
                      <tr key={item.cause} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="font-medium text-gray-900">{causeLabels[item.cause] || item.cause}</span>
                        </td>
                        <td className="py-3 px-4 text-right text-green-600 font-semibold">
                          ₹{item.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-600">{percentage}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
