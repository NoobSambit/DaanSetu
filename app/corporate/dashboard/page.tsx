import Link from "next/link";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function money(paise: number) {
  return (paise / 100).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
}

export default async function CorporateDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/corporate/dashboard");

  const { data: account } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (account?.role !== "corporate") redirect("/dashboard");

  const { data: corporate } = await supabase
    .from("corporate_profiles")
    .select("id, company_name")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!corporate) redirect("/corporate/profile");

  const admin = createAdminClient();
  const [employeesResult, initiativesResult, pledgesResult, donationsResult] =
    await Promise.all([
      admin
        .from("corporate_employees")
        .select("id", { count: "exact", head: true })
        .eq("corporate_id", corporate.id),
      admin
        .from("csr_initiatives")
        .select("id, title, match_percent, status, starts_at, ends_at")
        .eq("corporate_id", corporate.id)
        .order("created_at", { ascending: false }),
      admin
        .from("csr_match_pledges")
        .select("matched_paise, status, csr_initiatives!inner(corporate_id)")
        .eq("csr_initiatives.corporate_id", corporate.id),
      admin
        .from("donations")
        .select("id, amount_paise, ngo_id, captured_at")
        .eq("corporate_id", corporate.id)
        .eq("is_csr_match", true)
        .eq("status", "captured")
        .order("captured_at", { ascending: false }),
    ]);
  const pledges = pledgesResult.data ?? [];
  const allocated = donationsResult.data ?? [];
  const outstandingPaise = pledges
    .filter((pledge) => pledge.status === "outstanding")
    .reduce((sum, pledge) => sum + pledge.matched_paise, 0);
  const allocatedPaise = allocated.reduce(
    (sum, donation) => sum + donation.amount_paise,
    0,
  );
  const ngoCount = new Set(allocated.map((donation) => donation.ngo_id)).size;

  const stats = [
    ["Allocated CSR matching", money(allocatedPaise)],
    ["Outstanding pledges", money(outstandingPaise)],
    ["Employees linked", String(employeesResult.count ?? 0)],
    ["NGOs supported", String(ngoCount)],
  ] as const;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              Corporate CSR dashboard
            </p>
            <h1 className="mt-2 text-3xl font-bold text-[#10214e]">
              {corporate.company_name}
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link className="btn btn-secondary" href="/corporate/employees">
              Employees
            </Link>
            <Link className="btn btn-primary" href="/corporate/settlements">
              Matching & settlements
            </Link>
          </div>
        </div>

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

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-900">
                Matching initiatives
              </h2>
              <Link
                className="text-sm font-semibold text-blue-700"
                href="/corporate/settlements"
              >
                Manage
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {initiativesResult.data?.length ? (
                initiativesResult.data.slice(0, 6).map((initiative) => (
                  <article
                    className="rounded-xl bg-slate-50 p-4"
                    key={initiative.id}
                  >
                    <p className="font-semibold text-slate-900">
                      {initiative.title}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {initiative.match_percent}% match · {initiative.status}
                    </p>
                  </article>
                ))
              ) : (
                <p className="text-sm text-slate-600">
                  No employee matching initiatives yet.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-bold text-slate-900">
              Recent allocated matches
            </h2>
            <div className="mt-4 space-y-3">
              {allocated.length ? (
                allocated.slice(0, 6).map((donation) => (
                  <article
                    className="rounded-xl bg-emerald-50 p-4"
                    key={donation.id}
                  >
                    <p className="font-semibold text-emerald-950">
                      {money(donation.amount_paise)}
                    </p>
                    <p className="mt-1 text-xs text-emerald-800">
                      Captured{" "}
                      {new Date(donation.captured_at).toLocaleDateString(
                        "en-IN",
                      )}
                    </p>
                  </article>
                ))
              ) : (
                <p className="text-sm text-slate-600">
                  No matching settlement has been captured yet.
                </p>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
