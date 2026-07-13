import Link from "next/link";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default async function GivingDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/dashboard/giving");

  const admin = createAdminClient();
  const [{ data: donations }, { data: subscriptions }, { data: refunds }] =
    await Promise.all([
      admin
        .from("donations")
        .select(
          "id, amount_paise, status, captured_at, receipt_number, is_demo, ngos(name)",
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
                {donation.status === "captured" && (
                  <Link
                    className="font-semibold text-blue-600"
                    href={`/api/receipts/${donation.id}`}
                  >
                    Receipt
                  </Link>
                )}
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
        <p className="mt-3 rounded-xl border border-slate-200 bg-white p-5 text-slate-600">
          {subscriptions?.length
            ? `${subscriptions.length} subscription record(s). Manage pause, resume, or cancellation from the subscription controls.`
            : "No recurring gifts configured."}
        </p>

        <h2 className="mt-10 text-xl font-bold text-slate-900">
          Refund requests
        </h2>
        <p className="mt-3 rounded-xl border border-slate-200 bg-white p-5 text-slate-600">
          {refunds?.length
            ? `${refunds.length} request(s), with the latest status shown in your notifications.`
            : "No refund requests."}
        </p>
      </section>
    </main>
  );
}
