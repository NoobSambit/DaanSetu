import Link from "next/link";

import { submitVolunteerApplicationFormAction } from "@/app/volunteer/actions";
import { scoreVolunteerOpportunity } from "@/lib/domain/volunteer-matching";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const skills = [
  "Teaching",
  "Medical",
  "Event Support",
  "Fundraising",
  "Logistics",
  "Technical",
  "Other",
] as const;
const availabilityOptions = ["Weekdays", "Weekends", "Flexible"] as const;
const pageSize = 12;

type SearchParams = Record<string, string | string[] | undefined>;

function scalar(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function safeSearch(value: string | undefined) {
  const normalized = value?.trim().slice(0, 80) ?? "";
  return /^[\p{L}\p{N}\s'-]*$/u.test(normalized) ? normalized : "";
}

function pageHref(params: SearchParams, page: number) {
  const query = new URLSearchParams();
  for (const [key, rawValue] of Object.entries(params)) {
    const value = scalar(rawValue);
    if (value && key !== "page") query.set(key, value);
  }
  query.set("page", String(page));
  return `/volunteer/opportunities?${query.toString()}`;
}

export default async function VolunteerOpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const search = safeSearch(scalar(params.search));
  const selectedSkill = skills.includes(
    scalar(params.skill) as (typeof skills)[number],
  )
    ? scalar(params.skill)!
    : "";
  const selectedAvailability = availabilityOptions.includes(
    scalar(params.availability) as (typeof availabilityOptions)[number],
  )
    ? scalar(params.availability)!
    : "";
  const selectedCity = (scalar(params.city) ?? "").trim().slice(0, 100);
  const requestedPage = Number.parseInt(scalar(params.page) ?? "1", 10);
  const page = Number.isFinite(requestedPage)
    ? Math.max(1, Math.min(requestedPage, 10_000))
    : 1;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data: profile }, { data: cityRows }] = await Promise.all([
    user
      ? supabase
          .from("volunteer_profiles")
          .select("city, skills, availability")
          .eq("user_id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("volunteer_opportunities")
      .select("city")
      .eq("status", "active")
      .gte("date", new Date().toISOString()),
  ]);

  let query = supabase
    .from("volunteer_opportunities")
    .select(
      "id, ngo_id, title, description, city, required_skills, availability, date, total_needed, status, created_at, ngo:ngos!inner(id, name, display_name, profile_status)",
      { count: "exact" },
    )
    .eq("status", "active")
    .eq("ngo.profile_status", "published")
    .gte("date", new Date().toISOString());

  if (search) query = query.ilike("title", `%${search}%`);
  if (selectedSkill) query = query.contains("required_skills", [selectedSkill]);
  if (selectedAvailability) {
    query = query.contains("availability", [selectedAvailability]);
  }
  if (selectedCity) query = query.eq("city", selectedCity);

  const offset = (page - 1) * pageSize;
  const { data, count, error } = await query
    .order("date", { ascending: true })
    .range(offset, offset + pageSize - 1);
  const opportunities = (data ?? []).map((opportunity) => ({
    ...opportunity,
    matchScore: profile
      ? scoreVolunteerOpportunity({
          profile: {
            city: profile.city,
            skills: profile.skills,
            availability: profile.availability,
          },
          opportunity: {
            city: opportunity.city,
            requiredSkills: opportunity.required_skills,
            availability: opportunity.availability,
          },
        })
      : null,
  }));
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const applicationRows = user
    ? await supabase
        .from("volunteer_applications")
        .select("opportunity_id, status")
        .eq("user_id", user.id)
    : { data: [] };
  const applications = new Map(
    (applicationRows.data ?? []).map((application) => [
      application.opportunity_id,
      application.status,
    ]),
  );
  const cities = [...new Set((cityRows ?? []).map((row) => row.city))].sort();

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <section className="mx-auto max-w-7xl px-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-blue-700">
              Skill-based volunteering
            </p>
            <h1 className="mt-2 text-4xl font-bold text-slate-950">
              Volunteer opportunities
            </h1>
            <p className="mt-2 text-slate-600">
              Search real, active opportunities published by NGOs.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/volunteer/profile" className="btn btn-secondary">
              Volunteer profile
            </Link>
            <Link href="/volunteer/dashboard" className="btn btn-primary">
              My participation
            </Link>
          </div>
        </div>

        <form
          action="/volunteer/opportunities"
          className="mt-8 grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-5"
        >
          <label className="text-sm font-semibold text-slate-800">
            Search
            <input
              name="search"
              type="search"
              defaultValue={search}
              className="input mt-2"
              placeholder="Opportunity title"
            />
          </label>
          <label className="text-sm font-semibold text-slate-800">
            Skill
            <select
              name="skill"
              defaultValue={selectedSkill}
              className="input mt-2"
            >
              <option value="">All skills</option>
              {skills.map((skill) => (
                <option key={skill}>{skill}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-800">
            City
            <select
              name="city"
              defaultValue={selectedCity}
              className="input mt-2"
            >
              <option value="">All cities</option>
              {cities.map((city) => (
                <option key={city}>{city}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-800">
            Availability
            <select
              name="availability"
              defaultValue={selectedAvailability}
              className="input mt-2"
            >
              <option value="">Any availability</option>
              {availabilityOptions.map((availability) => (
                <option key={availability}>{availability}</option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-2">
            <Link href="/volunteer/opportunities" className="btn btn-secondary">
              Reset
            </Link>
            <button className="btn btn-primary flex-1">Search</button>
          </div>
        </form>

        {error ? (
          <div
            role="alert"
            className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-10 text-center text-red-800"
          >
            Opportunity discovery is temporarily unavailable. Please retry.
          </div>
        ) : opportunities.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <h2 className="text-xl font-bold text-slate-900">
              No matching opportunities
            </h2>
            <p className="mt-2 text-slate-600">
              Clear a filter or check again later.
            </p>
          </div>
        ) : (
          <>
            <p className="mt-8 text-sm text-slate-600">
              {total.toLocaleString("en-IN")} opportunities · page {page} of{" "}
              {totalPages}
            </p>
            <div className="mt-4 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {opportunities.map((opportunity) => {
                const ngo = opportunity.ngo as unknown as {
                  id: string;
                  name: string;
                  display_name: string | null;
                };
                const status = applications.get(opportunity.id);
                return (
                  <article
                    key={opportunity.id}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-bold text-slate-950">
                          {opportunity.title}
                        </h2>
                        <Link
                          href={`/ngos/${ngo.id}`}
                          className="mt-1 block text-sm font-semibold text-blue-700"
                        >
                          {ngo.display_name ?? ngo.name}
                        </Link>
                      </div>
                      {opportunity.matchScore !== null && (
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                          {opportunity.matchScore}% match
                        </span>
                      )}
                    </div>
                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
                      {opportunity.description}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {opportunity.required_skills.map((skill: string) => (
                        <span
                          key={skill}
                          className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                    <dl className="mt-5 space-y-2 text-sm text-slate-600">
                      <div className="flex justify-between gap-3">
                        <dt>Location</dt>
                        <dd className="font-semibold text-slate-900">
                          {opportunity.city}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt>Date</dt>
                        <dd className="font-semibold text-slate-900">
                          {new Date(opportunity.date).toLocaleDateString(
                            "en-IN",
                          )}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt>Availability</dt>
                        <dd className="text-right font-semibold text-slate-900">
                          {opportunity.availability.join(", ")}
                        </dd>
                      </div>
                    </dl>
                    {status ? (
                      <p className="mt-5 rounded-lg bg-slate-100 p-3 text-sm font-semibold capitalize text-slate-700">
                        Application: {status}
                      </p>
                    ) : !user ? (
                      <Link
                        href={`/sign-in?next=${encodeURIComponent("/volunteer/opportunities")}`}
                        className="btn btn-primary mt-5 w-full"
                      >
                        Sign in to apply
                      </Link>
                    ) : !profile ? (
                      <Link
                        href="/volunteer/profile"
                        className="btn btn-primary mt-5 w-full"
                      >
                        Complete profile to apply
                      </Link>
                    ) : (
                      <form
                        action={submitVolunteerApplicationFormAction}
                        className="mt-5 space-y-3"
                      >
                        <input
                          type="hidden"
                          name="opportunityId"
                          value={opportunity.id}
                        />
                        <label className="block text-sm font-semibold text-slate-800">
                          Why are you a good fit?
                          <textarea
                            name="message"
                            required
                            minLength={20}
                            maxLength={1500}
                            rows={3}
                            className="input mt-2"
                          />
                        </label>
                        <button className="btn btn-primary w-full">
                          Submit application
                        </button>
                      </form>
                    )}
                  </article>
                );
              })}
            </div>
          </>
        )}

        {totalPages > 1 && (
          <nav
            aria-label="Opportunity result pages"
            className="mt-8 flex justify-center gap-3"
          >
            {page > 1 && (
              <Link
                className="btn btn-secondary"
                href={pageHref(params, page - 1)}
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                className="btn btn-secondary"
                href={pageHref(params, page + 1)}
              >
                Next
              </Link>
            )}
          </nav>
        )}
      </section>
    </main>
  );
}
