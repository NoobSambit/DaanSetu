import Link from "next/link";

import SearchFilters from "@/components/SearchFilters";
import NgoExplorer from "@/components/discovery/NgoExplorer";
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
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <header className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-slate-950">
            Discover NGOs
          </h1>
          <p className="text-slate-600">
            Search published organizations using verified platform records.
          </p>
        </header>

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
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <h2 className="text-xl font-semibold text-slate-900">
                No NGOs match these filters
              </h2>
              <p className="mt-2 text-slate-600">
                Clear one or more filters or broaden the distance range.
              </p>
              <Link href="/ngos" className="btn btn-secondary mt-5">
                Reset filters
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
