import Link from "next/link";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { financialYearForDate } from "@/lib/domain/financial-year";
import { requestRefundAction } from "./actions";
import { SubscriptionControls } from "./GivingControls";
import { saveTaxProfileAction } from "./tax-profile/actions";

export default async function GivingDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/dashboard/giving");

  const admin = createAdminClient();
  const currentFinancialYear = financialYearForDate(new Date());
  const [
    { data: donations },
    { data: subscriptions },
    { data: refunds },
    { data: taxProfile },
  ] = await Promise.all([
    admin
      .from("donations")
      .select(
        "id, amount_paise, status, captured_at, receipt_number, is_demo, ngos(name), tax_certificates(id, certificate_number)",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    admin
      .from("subscriptions")
      .select("id, amount_paise, interval, status, created_at")
      .eq("donor_id", user.id)
      .order("created_at", { ascending: false }),
    admin
      .from("refund_requests")
      .select("id, donation_id, amount_paise, status, created_at")
      .eq("requester_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("donor_tax_profiles")
      .select("id_code, consented_at, updated_at")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <section className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold text-[#10214e]">
          Giving and receipts
        </h1>
        <p className="mt-2 text-slate-600">
          Captured donations, recurring gifts, receipts, and refund status from
          your account.
        </p>

        <h2 className="mt-10 text-xl font-bold text-slate-900">Donations</h2>
        <div className="mt-4 space-y-3">
          {donations?.length ? (
            donations.map((donation) => (
              <article
                key={donation.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    ₹{(donation.amount_paise / 100).toLocaleString("en-IN")}
                  </p>
                  <p className="text-sm text-slate-500">
                    {donation.is_demo
                      ? "Demo — excluded from totals"
                      : donation.status}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {["captured", "partially_refunded", "refunded"].includes(
                    donation.status,
                  ) && (
                    <Link
                      className="font-semibold text-blue-600"
                      href={`/api/receipts/${donation.id}`}
                    >
                      Receipt
                    </Link>
                  )}
                  {(
                    donation.tax_certificates as Array<{
                      id: string;
                      certificate_number: string;
                    }>
                  )?.[0] && (
                    <Link
                      className="font-semibold text-emerald-700"
                      href={`/api/tax-certificates/${donation.tax_certificates[0].id}`}
                    >
                      Official Form 10BE
                    </Link>
                  )}
                  {donation.status === "captured" && !donation.is_demo && (
                    <details className="rounded-lg border border-slate-200 p-3">
                      <summary className="cursor-pointer text-sm font-semibold text-blue-700">
                        Request refund
                      </summary>
                      <form
                        action={requestRefundAction}
                        className="mt-3 w-full min-w-64 space-y-3"
                      >
                        <input
                          type="hidden"
                          name="donationId"
                          value={donation.id}
                        />
                        <label className="block text-xs font-semibold text-slate-700">
                          Amount in paise
                          <input
                            name="amountPaise"
                            type="number"
                            min={1}
                            max={donation.amount_paise}
                            defaultValue={donation.amount_paise}
                            required
                            className="input mt-1"
                          />
                        </label>
                        <label className="block text-xs font-semibold text-slate-700">
                          Reason
                          <textarea
                            name="reason"
                            minLength={20}
                            maxLength={1000}
                            required
                            className="input mt-1 min-h-20"
                          />
                        </label>
                        <button type="submit" className="btn btn-primary">
                          Submit request
                        </button>
                      </form>
                    </details>
                  )}
                </div>
              </article>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
              No donation records yet.
            </p>
          )}
        </div>

        <h2 className="mt-10 text-xl font-bold text-slate-900">
          Recurring giving
        </h2>
        <div className="mt-3 space-y-3">
          {subscriptions?.length ? (
            subscriptions.map((subscription) => (
              <article
                key={subscription.id}
                className="rounded-xl border border-slate-200 bg-white p-5"
              >
                <p className="font-semibold text-slate-900">
                  ₹{(subscription.amount_paise / 100).toLocaleString("en-IN")} ·{" "}
                  {subscription.interval}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Status: {subscription.status}
                </p>
                <SubscriptionControls
                  subscriptionId={subscription.id}
                  status={subscription.status}
                />
              </article>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
              No recurring gifts configured.
            </p>
          )}
        </div>

        <h2 className="mt-10 text-xl font-bold text-slate-900">
          Refund requests
        </h2>
        <div className="mt-3 space-y-3">
          {refunds?.length ? (
            refunds.map((refund) => (
              <p
                key={refund.id}
                className="rounded-xl border border-slate-200 bg-white p-5 text-slate-600"
              >
                ₹{(refund.amount_paise / 100).toLocaleString("en-IN")} ·{" "}
                {refund.status}
              </p>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
              No refund requests.
            </p>
          )}
        </div>

        <h2 className="mt-10 text-xl font-bold text-slate-900">
          Financial-year summary
        </h2>
        <Link
          href={`/dashboard/giving/financial-year?financialYear=${currentFinancialYear}`}
          className="btn btn-secondary mt-3"
        >
          Download {currentFinancialYear} CSV
        </Link>

        <h2 className="mt-10 text-xl font-bold text-slate-900">
          Tax certificate details
        </h2>
        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-600">
            Verified 80G organizations need your identification and address to
            prepare Form 10BD data. These values are encrypted before storage
            and are not displayed back after submission.
          </p>
          {taxProfile && (
            <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
              Tax details saved using {taxProfile.id_code}. Submit the form
              again to replace them.
            </p>
          )}
          <form
            action={saveTaxProfileAction}
            className="mt-5 grid gap-4 sm:grid-cols-2"
          >
            <label className="text-sm font-semibold text-slate-800">
              Identification type
              <select name="idCode" className="input mt-2" required>
                <option value="PAN">PAN</option>
                <option value="AADHAAR">Aadhaar</option>
                <option value="PASSPORT">Passport</option>
                <option value="VOTER_ID">Voter ID</option>
                <option value="FOREIGN_TIN">Foreign tax ID</option>
              </select>
            </label>
            <label className="text-sm font-semibold text-slate-800">
              Identification number
              <input
                name="identifier"
                autoComplete="off"
                minLength={4}
                maxLength={100}
                className="input mt-2"
                required
              />
            </label>
            <label className="text-sm font-semibold text-slate-800 sm:col-span-2">
              Full donor address
              <textarea
                name="address"
                minLength={10}
                maxLength={1000}
                className="input mt-2 min-h-24"
                required
              />
            </label>
            <label className="flex items-start gap-3 text-sm text-slate-700 sm:col-span-2">
              <input name="consent" type="checkbox" required className="mt-1" />
              <span>
                I authorize DaanSetu to provide these details only to eligible
                organizations for statutory donation reporting and certificate
                mapping.
              </span>
            </label>
            <button type="submit" className="btn btn-primary sm:w-fit">
              {taxProfile ? "Replace tax details" : "Save tax details"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
