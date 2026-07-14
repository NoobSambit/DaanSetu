"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Props = {
  donations: Array<{ date: string; amount: number }>;
  campaigns: Array<{ date: string; count: number }>;
  volunteers: Array<{ date: string; count: number }>;
};

function EmptyChart({ message }: { message: string }) {
  return <p className="py-16 text-center text-slate-500">{message}</p>;
}

export default function PublicImpactCharts({
  donations,
  campaigns,
  volunteers,
}: Props) {
  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
        <h2 className="text-xl font-bold text-slate-900">
          Net captured giving over time
        </h2>
        <div className="mt-5 h-80">
          {donations.length ? (
            <ResponsiveContainer height="100%" width="100%">
              <LineChart data={donations}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  dataKey="amount"
                  name="Net amount (₹)"
                  stroke="#2563eb"
                  strokeWidth={2}
                  type="monotone"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No net captured giving has been recorded." />
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">
          Published campaigns
        </h2>
        <div className="mt-5 h-72">
          {campaigns.length ? (
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={campaigns}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#059669" name="Campaigns" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No published campaigns yet." />
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">
          Volunteer community growth
        </h2>
        <div className="mt-5 h-72">
          {volunteers.length ? (
            <ResponsiveContainer height="100%" width="100%">
              <LineChart data={volunteers}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line
                  dataKey="count"
                  name="Volunteer profiles"
                  stroke="#d97706"
                  strokeWidth={2}
                  type="monotone"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No volunteer profiles yet." />
          )}
        </div>
      </section>
    </div>
  );
}
