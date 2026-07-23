/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { CirclePlus, HeartHandshake } from "lucide-react";

import AICampaignSuggestions from "@/app/campaigns/components/AICampaignSuggestions";
import { EmptyState, PageHeader } from "@/components/ui/PagePrimitives";
import { discoverCampaigns } from "@/lib/discovery/campaigns";
import { parseCampaignDiscoveryParams } from "@/lib/discovery/filters";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

const categoryOptions = [
  ["", "All categories"],
  ["education", "Education"],
  ["food", "Food security"],
  ["health", "Healthcare"],
  ["women", "Women empowerment"],
  ["animals", "Animal welfare"],
  ["disaster", "Disaster relief"],
] as const;

const categoryEmoji: Record<string, string> = {
  education: "📚",
  food: "🍲",
  health: "🏥",
  women: "👩",
  animals: "🐾",
  disaster: "🆘",
};

function pageUrl(params: SearchParams, page: number) {
  const url = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const scalar = Array.isArray(value) ? value[0] : value;
    if (scalar && key !== "page") url.set(key, scalar);
  }
  url.set("page", String(page));
  return `/campaigns?${url.toString()}`;
}

function money(amountPaise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amountPaise / 100);
}

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const filters = parseCampaignDiscoveryParams(params);
  const result = await discoverCampaigns(filters);

  return (
    <main className="page-frame">
      <div className="page-content">
        <PageHeader
          eyebrow="Fundraising with safeguards"
          title="Active campaigns"
          description="Only approved fundraisers with enabled collection appear here, so every amount shown is tied to a real campaign."
          actions={
            <Link href="/campaigns/create" className="btn btn-primary">
              <CirclePlus className="h-4 w-4" aria-hidden="true" />
              Start a fundraiser
            </Link>
          }
        />

        <AICampaignSuggestions />

        <form
          action="/campaigns"
          method="get"
          className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="grid gap-4 md:grid-cols-4">
            <label className="text-sm font-semibold text-slate-900">
              Search
              <input
                type="search"
                name="search"
                defaultValue={filters.search}
                placeholder="Campaign or cause"
                className="input mt-2"
              />
            </label>
            <label className="text-sm font-semibold text-slate-900">
              Category
              <select
                name="category"
                defaultValue={filters.category ?? ""}
                className="input mt-2"
              >
                {categoryOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold text-slate-900">
              Sort by
              <select
                name="sort"
                defaultValue={filters.sort}
                className="input mt-2"
              >
                <option value="newest">Newest</option>
                <option value="ending-soon">Ending soon</option>
                <option value="most-funded">Most funded</option>
                <option value="progress">Highest progress</option>
              </select>
            </label>
            <div className="flex items-end gap-2">
              <Link href="/campaigns" className="btn btn-secondary">
                Reset
              </Link>
              <button type="submit" className="btn btn-primary flex-1">
                Apply filters
              </button>
            </div>
          </div>
        </form>

        {result.error ? (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-10 text-center"
          >
            <h2 className="font-semibold text-red-900">
              Campaign discovery is temporarily unavailable
            </h2>
            <p className="mt-2 text-sm text-red-700">
              Please retry shortly. No campaign records were substituted.
            </p>
          </div>
        ) : result.campaigns.length === 0 ? (
          <EmptyState
            title="No active campaigns match these filters"
            description="Try another category or clear the search query to see approved fundraisers."
            action={
              <Link href="/campaigns" className="btn btn-secondary">
                Clear filters
              </Link>
            }
            icon={<HeartHandshake className="h-5 w-5" />}
          />
        ) : (
          <>
            <p className="mb-4 text-sm text-slate-600">
              {result.total.toLocaleString("en-IN")} active campaigns · page{" "}
              {result.page} of {result.totalPages}
            </p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {result.campaigns.map((campaign) => {
                const progress = Math.min(
                  100,
                  Math.round(
                    (campaign.raisedPaise / campaign.targetPaise) * 100,
                  ),
                );
                const deadlineLabel = new Intl.DateTimeFormat("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }).format(new Date(campaign.deadline));
                return (
                  <Link
                    key={campaign.id}
                    href={`/campaigns/${campaign.id}`}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="relative flex h-48 items-center justify-center bg-slate-100">
                      {campaign.imageUrl ? (
                        <img
                          src={campaign.imageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-6xl" aria-hidden="true">
                          {categoryEmoji[campaign.category]}
                        </span>
                      )}
                      <span className="absolute right-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-semibold capitalize shadow-sm">
                        {campaign.category}
                      </span>
                    </div>
                    <div className="p-6">
                      <h2 className="line-clamp-2 text-xl font-bold text-slate-950">
                        {campaign.title}
                      </h2>
                      <p className="mt-2 line-clamp-2 min-h-10 text-sm text-slate-600">
                        {campaign.shortDescription}
                      </p>
                      <p className="mt-4 text-sm font-semibold text-blue-700">
                        by {campaign.ngoName}
                      </p>
                      <div className="mt-4">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-900">
                            {money(campaign.raisedPaise)}
                          </span>
                          <span className="text-slate-500">
                            of {money(campaign.targetPaise)}
                          </span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-blue-600"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="mt-2 flex justify-between text-xs text-slate-500">
                          <span>{progress}% funded</span>
                          <span>Ends {deadlineLabel}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            {result.totalPages > 1 && (
              <nav
                aria-label="Campaign result pages"
                className="mt-8 flex justify-center gap-3"
              >
                {result.page > 1 && (
                  <Link
                    href={pageUrl(params, result.page - 1)}
                    className="btn btn-secondary"
                  >
                    Previous
                  </Link>
                )}
                {result.page < result.totalPages && (
                  <Link
                    href={pageUrl(params, result.page + 1)}
                    className="btn btn-primary"
                  >
                    Next
                  </Link>
                )}
              </nav>
            )}
          </>
        )}
      </div>
    </main>
  );
}
