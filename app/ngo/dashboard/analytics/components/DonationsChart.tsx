'use client'

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface DonationsChartProps {
  data: Array<{ date: string; amount: number }>
}

export default function DonationsChart({ data }: DonationsChartProps) {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} name="Amount (₹)" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
