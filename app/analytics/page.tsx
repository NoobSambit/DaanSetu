import PublicImpactCharts from "@/app/analytics/PublicImpactCharts";
import { getPublicImpactAnalytics } from "@/lib/impact/public-analytics";

export const dynamic = "force-dynamic";

function money(amountPaise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amountPaise / 100);
}

export default async function AnalyticsPage() {
  let analytics: Awaited<ReturnType<typeof getPublicImpactAnalytics>> | null =
    null;
  try {
    analytics = await getPublicImpactAnalytics();
  } catch {
    // The page presents an explicit unavailable state below.
  }

  if (!analytics) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-16">
        <section className="mx-auto max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
          <h1 className="text-3xl font-bold text-[#10214e]">
            Public impact is temporarily unavailable
          </h1>
          <p className="mt-3 text-amber-900">
            No totals are estimated when transactional records cannot be read.
          </p>
        </section>
      </main>
    );
  }

  const stats = [
    ["Net funds recorded", money(analytics.metrics.netFundsPaise)],
    ["Captured gifts with net value", analytics.metrics.capturedGifts],
    ["Published NGOs", analytics.metrics.publishedNgos],
    ["Active campaigns", analytics.metrics.activeCampaigns],
    ["Volunteer profiles", analytics.metrics.volunteers],
    ["Approved volunteer hours", analytics.metrics.approvedVolunteerHours],
    ["States reached", analytics.metrics.statesReached],
  ] as const;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <section className="mx-auto max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
          Public impact
        </p>
        <h1 className="mt-2 text-4xl font-bold text-[#10214e]">
          Platform-tracked outcomes
        </h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          These totals come from captured, non-demo transactions and approved
          volunteer records. Refunds are deducted; NGO-reported impact remains
          separate on organization profiles.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(([label, value]) => (
            <article
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              key={label}
            >
              <p className="text-sm font-medium text-slate-600">{label}</p>
              <p className="mt-2 text-2xl font-bold text-[#10214e]">{value}</p>
            </article>
          ))}
        </div>

        <PublicImpactCharts
          campaigns={analytics.campaignsOverTime}
          donations={analytics.donationsOverTime}
          volunteers={analytics.volunteersOverTime}
        />
      </section>
    </main>
  );
}
