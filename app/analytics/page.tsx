import PublicImpactCharts from "@/app/analytics/PublicImpactCharts";
import { BarChart3 } from "lucide-react";
import {
  EmptyState,
  MetricCard,
  PageHeader,
} from "@/components/ui/PagePrimitives";
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
      <main className="page-frame">
        <section className="page-content max-w-3xl">
          <EmptyState
            title="Public impact is temporarily unavailable"
            description="No totals are estimated when transactional records cannot be read. Please try again shortly."
            icon={<BarChart3 className="h-5 w-5" />}
          />
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
    <main className="page-frame">
      <section className="page-content">
        <PageHeader
          eyebrow="Public impact"
          title="Platform-tracked outcomes"
          description="These totals come from captured, non-demo transactions and approved volunteer records. Refunds are deducted; NGO-reported impact remains separate on organization profiles."
        />

        <div className="metric-grid">
          {stats.map(([label, value]) => (
            <MetricCard key={label} label={label} value={value} />
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
