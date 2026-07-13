import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function CsrSettlementOversightPage() {
  await requireAdmin("/admin/csr-settlements");
  const { data: settlements } = await createAdminClient()
    .from("csr_settlements")
    .select("id, corporate_id, amount_paise, status, created_at")
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <section className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold text-[#10214e]">
          CSR settlement oversight
        </h1>
        <div className="mt-8 space-y-3">
          {settlements?.length ? (
            settlements.map((settlement) => (
              <article
                key={settlement.id}
                className="rounded-xl border border-slate-200 bg-white p-5"
              >
                <p className="font-semibold text-slate-900">
                  ₹{(settlement.amount_paise / 100).toLocaleString("en-IN")} ·{" "}
                  {settlement.status}
                </p>
                <p className="mt-1 break-all text-xs text-slate-500">
                  Corporate {settlement.corporate_id}
                </p>
              </article>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
              No CSR settlement batches exist yet.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
