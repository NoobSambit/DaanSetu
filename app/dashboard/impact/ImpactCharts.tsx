"use client";

import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ImpactChartsProps {
  donations: Array<{ date: string; amount: number }>;
  causes: Array<{ name: string; value: number; color: string }>;
}

export default function ImpactCharts({ donations, causes }: ImpactChartsProps) {
  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Donation History
        </h2>
        {donations.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={donations}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#10b981"
                strokeWidth={2}
                name="Amount (₹)"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500 text-center py-12">
            No donation history yet
          </p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Causes Supported
        </h2>
        {causes.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={causes}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) =>
                  `${entry.name}: ₹${entry.value.toLocaleString("en-IN")}`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {causes.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500 text-center py-12">
            No donation data yet
          </p>
        )}
      </div>
    </div>
  );
}
