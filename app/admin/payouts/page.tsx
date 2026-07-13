import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function PayoutActivationPage() {
  await requireAdmin("/admin/payouts");
  const { data: accounts } = await createAdminClient()
    .from("payout_accounts")
    .select("id, owner_id, provider, status, created_at, updated_at")
    .order("created_at", { ascending: true });

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
              </article>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
              No payout accounts have been submitted.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
