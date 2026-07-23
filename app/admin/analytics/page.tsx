import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminAnalytics } from "@/lib/services/analytics";
import AnalyticsCharts from "./AnalyticsCharts";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/ui/PagePrimitives";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();

  // Check authentication and admin role
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/sign-in?next=/admin/analytics");
  }

  // Check if user is admin
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userData?.role !== "admin") {
    redirect("/");
  }

  // Get admin analytics
  const analytics = await getAdminAnalytics(createAdminClient());

  return (
    <main className="page-frame">
      <div className="page-content">
        <PageHeader
          eyebrow="Admin workspace"
          title="Analytics dashboard"
          description="System-wide insights and performance metrics for platform operations."
        />

        {/* AI Flags Summary */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Total AI Flags
                </p>
                <p className="text-3xl font-bold text-orange-600">
                  {analytics.aiFlags.total}
                </p>
              </div>
              <div className="bg-orange-100 p-4 rounded-full">
                <svg
                  className="w-8 h-8 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                  />
                </svg>
              </div>
            </div>
            <Link
              href="/admin/ai-flags"
              className="text-sm text-blue-600 hover:text-blue-700 mt-3 inline-block"
            >
              View all flags →
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-sm font-medium text-gray-600">
              NGO trust reviews
            </p>
            <p className="mt-2 text-lg font-bold text-slate-900">
              Verification queue
            </p>
            <Link
              href="/admin/ngo-verifications"
              className="mt-3 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Review submissions →
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  High Confidence Flags
                </p>
                <p className="text-3xl font-bold text-red-600">
                  {analytics.aiFlags.highConfidence}
                </p>
              </div>
              <div className="bg-red-100 p-4 rounded-full">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Requires immediate attention
            </p>
          </div>
        </div>

        <AnalyticsCharts
          donationsByRegion={analytics.donationsByRegion}
          campaignsByCategory={analytics.campaignsByCategory}
        />

        {/* Top NGOs by Donations */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Top 10 NGOs by Donations Received
          </h2>
          {analytics.topNGOs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Rank
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      NGO Name
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">
                      Total Received
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.topNGOs.map((ngo, index) => (
                    <tr
                      key={ngo.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                            index === 0
                              ? "bg-yellow-100 text-yellow-800"
                              : index === 1
                                ? "bg-gray-200 text-gray-700"
                                : index === 2
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/ngos/${ngo.id}`}
                          className="font-medium text-gray-900 hover:text-blue-600"
                        >
                          {ngo.name}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-right text-green-600 font-bold">
                        ₹{ngo.total.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-12">
              No NGO data available
            </p>
          )}
        </div>

        {/* Regional Heatmap (Simplified Table View) */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Donation Activity by Region
          </h2>
          {analytics.donationsByRegion.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {analytics.donationsByRegion.map((region) => {
                const maxAmount = Math.max(
                  ...analytics.donationsByRegion.map((r) => r.amount),
                );
                const intensity = (region.amount / maxAmount) * 100;
                const bgColor =
                  intensity > 75
                    ? "bg-green-600"
                    : intensity > 50
                      ? "bg-green-500"
                      : intensity > 25
                        ? "bg-green-400"
                        : "bg-green-300";

                return (
                  <div
                    key={region.region}
                    className={`${bgColor} text-white p-4 rounded-lg`}
                  >
                    <p className="font-semibold text-sm">{region.region}</p>
                    <p className="text-xl font-bold mt-1">
                      ₹{(region.amount / 1000).toFixed(0)}K
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-12">
              No regional data available
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
