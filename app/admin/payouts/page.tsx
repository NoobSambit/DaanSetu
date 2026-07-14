import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { executePayoutAction, reviewPayoutAccountAction } from "./actions";

export default async function PayoutActivationPage() {
  await requireAdmin("/admin/payouts");
  const admin = createAdminClient();
  const [{ data: accounts }, { data: donations }, { data: transfers }] =
    await Promise.all([
      admin
        .from("payout_accounts")
        .select(
          "id, owner_id, provider, status, beneficiary, created_at, updated_at",
        )
        .order("created_at", { ascending: true }),
      admin
        .from("donations")
        .select(
          "id, amount_paise, receipt_number, captured_at, campaigns(title), payment_transfers(id, status)",
        )
        .eq("is_demo", false)
        .eq("status", "captured")
        .order("captured_at", { ascending: true })
        .limit(100),
      admin
        .from("payment_transfers")
        .select(
          "id, amount_paise, status, failure_reason, settled_at, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
  const payableDonations = (donations ?? []).filter(
    (donation) =>
      !(donation.payment_transfers as Array<{ id: string }> | null)?.length,
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <section className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold text-[#10214e]">
          Payout account oversight
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Campaign collection remains disabled until its PayPal recipient is
          active.
        </p>
        <div className="mt-8 space-y-3">
          {accounts?.length ? (
            accounts.map((account) => (
              <article
                key={account.id}
                className="rounded-xl border border-slate-200 bg-white p-5"
              >
                <p className="font-semibold text-slate-900">
                  {account.provider} · {account.status}
                </p>
                <p className="mt-1 break-all text-xs text-slate-500">
                  Owner {account.owner_id}
                </p>
                {account.status === "pending" && (
                  <form
                    action={reviewPayoutAccountAction}
                    className="mt-4 space-y-3"
                  >
                    <input
                      type="hidden"
                      name="payoutAccountId"
                      value={account.id}
                    />
                    <label className="block text-sm font-semibold text-slate-800">
                      Review note
                      <textarea
                        name="note"
                        required
                        minLength={10}
                        maxLength={1000}
                        className="input mt-2 min-h-24"
                      />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        name="status"
                        value="active"
                        className="btn btn-primary"
                      >
                        Activate
                      </button>
                      <button
                        name="status"
                        value="restricted"
                        className="btn btn-secondary"
                      >
                        Restrict
                      </button>
                      <button
                        name="status"
                        value="rejected"
                        className="btn btn-secondary"
                      >
                        Reject
                      </button>
                    </div>
                  </form>
                )}
              </article>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
              No payout accounts have been submitted.
            </p>
          )}
        </div>

        <h2 className="mt-12 text-2xl font-bold text-[#10214e]">
          Eligible captured donations
        </h2>
        <div className="mt-5 space-y-3">
          {payableDonations.length ? (
            payableDonations.map((donation) => (
              <article
                key={donation.id}
                className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {(donation.campaigns as { title?: string } | null)?.title ??
                      "Campaign donation"}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {donation.receipt_number} · ₹
                    {(donation.amount_paise / 100).toLocaleString("en-IN")}
                  </p>
                </div>
                <form action={executePayoutAction}>
                  <input type="hidden" name="donationId" value={donation.id} />
                  <button className="btn btn-primary" type="submit">
                    Send PayPal payout
                  </button>
                </form>
              </article>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
              No captured donations are waiting for payout.
            </p>
          )}
        </div>

        <h2 className="mt-12 text-2xl font-bold text-[#10214e]">
          Transfer reconciliation
        </h2>
        <div className="mt-5 space-y-3">
          {transfers?.length ? (
            transfers.map((transfer) => (
              <article
                key={transfer.id}
                className="rounded-xl border border-slate-200 bg-white p-5"
              >
                <p className="font-semibold text-slate-900">
                  ₹{(transfer.amount_paise / 100).toLocaleString("en-IN")} ·{" "}
                  {transfer.status}
                </p>
                {transfer.failure_reason && (
                  <p className="mt-2 text-sm text-red-700">
                    {transfer.failure_reason}
                  </p>
                )}
              </article>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
              No payout transfers have been initiated.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
