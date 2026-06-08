'use client'

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface AnalyticsChartsProps {
  donationsByRegion: Array<{ region: string; amount: number }>
  campaignsByCategory: Array<{ category: string; count: number }>
}

export default function AnalyticsCharts({ donationsByRegion, campaignsByCategory }: AnalyticsChartsProps) {
  return (
    <div className="grid md:grid-cols-2 gap-8 mb-8">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Top 10 Cities by Donations</h2>
        {donationsByRegion.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={donationsByRegion} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="region" type="category" width={100} />
              <Tooltip />
              <Legend />
              <Bar dataKey="amount" fill="#3b82f6" name="Amount (₹)" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500 text-center py-12">No regional data available</p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Campaigns by Category</h2>
        {campaignsByCategory.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={campaignsByCategory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#10b981" name="Campaigns" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500 text-center py-12">No campaign data available</p>
        )}
      </div>
    </div>
  )
}
