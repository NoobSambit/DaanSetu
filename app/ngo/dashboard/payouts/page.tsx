import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

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
            <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
              No payout account has been linked.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
