import { redirect } from "next/navigation";

import {
  createCsrInitiativeFormAction,
  transitionCsrInitiativeFormAction,
} from "@/app/corporate/actions";
import CsrSettlementButton from "@/app/corporate/settlements/CsrSettlementButton";
import { MetricCard, PageHeader } from "@/components/ui/PagePrimitives";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function money(paise: number) {
  return (paise / 100).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
  });
}

export default async function CorporateSettlementsPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string }>;
}) {
  const { payment } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/corporate/settlements");
  if (!user.email_confirmed_at) redirect("/check-email?type=signup");

  const { data: corporate } = await supabase
    .from("corporate_profiles")
    .select("id, company_name")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!corporate) redirect("/corporate/profile");

  const admin = createAdminClient();
  const [{ data: initiatives }, { data: pledges }, { data: settlements }] =
    await Promise.all([
      admin
        .from("csr_initiatives")
        .select(
          "id, title, description, match_percent, per_employee_cap_paise, initiative_cap_paise, starts_at, ends_at, status",
        )
        .eq("corporate_id", corporate.id)
        .order("created_at", { ascending: false }),
      admin
        .from("csr_match_pledges")
        .select(
          "id, matched_paise, status, created_at, csr_initiatives!inner(title, corporate_id), corporate_employees(name, email)",
        )
        .eq("status", "outstanding")
        .eq("csr_initiatives.corporate_id", corporate.id)
        .order("created_at", { ascending: true }),
      admin
        .from("csr_settlements")
        .select("id, amount_paise, status, settled_at, created_at")
        .eq("corporate_id", corporate.id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
  const outstandingTotal = (pledges ?? []).reduce(
    (sum, pledge) => sum + pledge.matched_paise,
    0,
  );

  return (
    <main className="page-frame">
      <section className="page-content">
        <PageHeader
          eyebrow={corporate.company_name}
          title="Employee matching and settlement"
          description="Matching pledges are created only after a verified employee donation. They become allocated donations only after the PayPal batch is captured and reconciled."
        />

        {payment && (
          <p
            aria-live="polite"
            className={`mb-6 rounded-xl border p-4 text-sm font-medium ${
              payment === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-amber-200 bg-amber-50 text-amber-900"
            }`}
          >
            {payment === "success"
              ? "PayPal settlement captured and matching donations allocated."
              : "The PayPal settlement was not completed. No unmatched pledge was allocated."}
          </p>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="panel p-5 sm:p-6">
            <h2 className="text-xl font-bold text-slate-900">
              Create matching initiative
            </h2>
            <form
              action={createCsrInitiativeFormAction}
              className="mt-5 grid gap-4 sm:grid-cols-2"
            >
              <input
                className="input sm:col-span-2"
                minLength={5}
                name="title"
                placeholder="Initiative title"
                required
              />
              <textarea
                className="input min-h-28 resize-y sm:col-span-2"
                minLength={20}
                name="description"
                placeholder="Describe the eligible giving program"
                required
              />
              <label className="text-sm font-semibold text-slate-700">
                Match percentage
                <input
                  className="input mt-1"
                  defaultValue="100"
                  max="500"
                  min="0"
                  name="matchPercent"
                  required
                  type="number"
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Per-employee cap (₹)
                <input
                  className="input mt-1"
                  min="0.01"
                  name="perEmployeeCap"
                  step="0.01"
                  type="number"
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Initiative cap (₹)
                <input
                  className="input mt-1"
                  min="0.01"
                  name="initiativeCap"
                  step="0.01"
                  type="number"
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Starts on
                <input
                  className="input mt-1"
                  name="startsOn"
                  required
                  type="date"
                />
              </label>
              <label className="text-sm font-semibold text-slate-700 sm:col-start-2">
                Ends on
                <input
                  className="input mt-1"
                  name="endsOn"
                  required
                  type="date"
                />
              </label>
              <button className="btn btn-primary sm:col-span-2" type="submit">
                Save initiative draft
              </button>
            </form>
          </section>

          <section className="panel p-5 sm:p-6">
            <h2 className="text-xl font-bold text-slate-900">
              Outstanding match pledges
            </h2>
            <MetricCard
              className="mt-4 rounded-xl border"
              label="Outstanding match pledges"
              value={money(outstandingTotal)}
              detail="Eligible gifts awaiting the next settlement batch"
            />
            <div className="mt-5 space-y-3">
              {pledges?.length ? (
                pledges.map((pledge) => {
                  const employee = Array.isArray(pledge.corporate_employees)
                    ? pledge.corporate_employees[0]
                    : pledge.corporate_employees;
                  const initiative = Array.isArray(pledge.csr_initiatives)
                    ? pledge.csr_initiatives[0]
                    : pledge.csr_initiatives;
                  return (
                    <article
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                      key={pledge.id}
                    >
                      <p className="font-semibold text-slate-900">
                        {money(pledge.matched_paise)} · {initiative?.title}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {employee?.name ?? employee?.email ?? "Linked employee"}
                      </p>
                    </article>
                  );
                })
              ) : (
                <p className="text-sm text-slate-600">
                  No captured employee gifts currently need matching.
                </p>
              )}
            </div>
            <div className="mt-5">
              <CsrSettlementButton
                pledgeIds={(pledges ?? []).map((pledge) => pledge.id)}
              />
            </div>
          </section>
        </div>

        <section className="panel mt-6 p-5 sm:p-6">
          <h2 className="text-xl font-bold text-slate-900">
            Matching initiatives
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {initiatives?.length ? (
              initiatives.map((initiative) => (
                <article
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  key={initiative.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {initiative.title}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {initiative.match_percent}% match · {initiative.status}
                      </p>
                    </div>
                    {!["completed", "cancelled"].includes(
                      initiative.status,
                    ) && (
                      <form action={transitionCsrInitiativeFormAction}>
                        <input
                          name="initiativeId"
                          type="hidden"
                          value={initiative.id}
                        />
                        <button
                          className="btn btn-secondary min-h-9 px-3 py-1.5 text-xs"
                          name="status"
                          type="submit"
                          value={
                            initiative.status === "active" ? "paused" : "active"
                          }
                        >
                          {initiative.status === "active"
                            ? "Pause"
                            : "Activate"}
                        </button>
                      </form>
                    )}
                  </div>
                </article>
              ))
            ) : (
              <p className="text-sm text-slate-600">
                No initiatives created yet.
              </p>
            )}
          </div>
        </section>

        <section className="panel mt-6 p-5 sm:p-6">
          <h2 className="text-xl font-bold text-slate-900">
            Settlement history
          </h2>
          <div className="mt-4 space-y-3">
            {settlements?.length ? (
              settlements.map((settlement) => (
                <p
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm"
                  key={settlement.id}
                >
                  <strong>{money(settlement.amount_paise)}</strong> ·{" "}
                  {settlement.status}
                </p>
              ))
            ) : (
              <p className="text-sm text-slate-600">
                No settlement batches yet.
              </p>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
