import Link from "next/link";
import { MapPinned } from "lucide-react";

import SearchFilters from "@/components/SearchFilters";
import NgoExplorer from "@/components/discovery/NgoExplorer";
import { EmptyState, PageHeader } from "@/components/ui/PagePrimitives";
import { parseNgoDiscoveryParams } from "@/lib/discovery/filters";
import { discoverNgos } from "@/lib/discovery/ngos";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function pageUrl(params: SearchParams, page: number) {
  const url = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const scalar = Array.isArray(value) ? value[0] : value;
    if (scalar && key !== "page") url.set(key, scalar);
  }
  url.set("page", String(page));
  return `/ngos?${url.toString()}`;
}

export default async function NGOsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const filters = parseNgoDiscoveryParams(params);
  const result = await discoverNgos(filters);

  return (
    <main className="page-frame">
      <div className="page-content">
        <PageHeader
          eyebrow="Verified discovery"
          title="Discover NGOs"
          description="Search published organizations using verified platform records, location, and cause-specific filters."
          actions={
            <Link href="/map" className="btn btn-secondary">
              <MapPinned className="h-4 w-4" aria-hidden="true" />
              Browse the map
            </Link>
          }
        />

        <SearchFilters filters={filters} />

        <section className="mt-8" aria-live="polite">
          {result.error ? (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-8 text-center"
            >
              <h2 className="text-lg font-semibold text-red-900">
                NGO discovery is temporarily unavailable
              </h2>
              <p className="mt-2 text-sm text-red-700">
                Please retry shortly. No results were substituted or invented.
              </p>
            </div>
          ) : result.ngos.length ? (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-600">
                  {result.total.toLocaleString("en-IN")} published{" "}
                  {result.total === 1 ? "organization" : "organizations"}
                </p>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Page {result.page} of {result.totalPages}
                </p>
              </div>
              <NgoExplorer ngos={result.ngos} />
              {result.totalPages > 1 && (
                <nav
                  aria-label="NGO result pages"
                  className="mt-8 flex items-center justify-center gap-3"
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
          ) : (
            <EmptyState
              title="No NGOs match these filters"
              description="Clear one or more filters or broaden the distance range to see more published organizations."
              action={
                <Link href="/ngos" className="btn btn-secondary">
                  Reset filters
                </Link>
              }
              icon={<MapPinned className="h-5 w-5" />}
            />
          )}
        </section>
      </div>
    </main>
  );
}
