import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { submitPayoutRecipientAction } from "./actions";

export default async function PayoutAccountsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/ngo/dashboard/payouts");
  const { data: accounts } = await supabase
    .from("payout_accounts")
    .select("id, provider, status, activated_at, updated_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });
  const accountIds = (accounts ?? []).map((account) => account.id);
  const { data: transfers } = accountIds.length
    ? await supabase
        .from("payment_transfers")
        .select(
          "id, amount_paise, status, failure_reason, settled_at, created_at",
        )
        .in("payout_account_id", accountIds)
        .order("created_at", { ascending: false })
    : { data: [] };
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <section className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-[#10214e]">Payout accounts</h1>
        <p className="mt-2 text-slate-600">
          Donation collection remains disabled until a reviewed payout account
          is active.
        </p>
        <div className="mt-8 space-y-3">
          {accounts?.length ? (
            accounts.map((account) => (
              <article
                key={account.id}
                className="rounded-xl border border-slate-200 bg-white p-5"
              >
                <p className="font-semibold text-slate-900">
                  {account.provider}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Status: {account.status}
                </p>
              </article>
            ))
          ) : (
            <form
              action={submitPayoutRecipientAction}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-lg font-bold text-slate-900">
                Submit PayPal recipient
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                The recipient remains pending until an administrator reviews the
                beneficiary and NGO verification records.
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold text-slate-800">
                  Beneficiary name
                  <input
                    name="beneficiaryName"
                    required
                    minLength={2}
                    maxLength={120}
                    className="input mt-2"
                  />
                </label>
                <label className="text-sm font-semibold text-slate-800">
                  PayPal recipient email
                  <input
                    name="recipientEmail"
                    type="email"
                    required
                    maxLength={254}
                    className="input mt-2"
                  />
                </label>
              </div>
              <button type="submit" className="btn btn-primary mt-5">
                Submit for review
              </button>
            </form>
          )}
        </div>

        <h2 className="mt-12 text-2xl font-bold text-[#10214e]">
          Transfer history
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
            <p className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
              No payout transfers have been initiated.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
