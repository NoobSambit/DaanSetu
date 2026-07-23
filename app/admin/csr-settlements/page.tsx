import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { EmptyState, PageHeader } from "@/components/ui/PagePrimitives";

export default async function CsrSettlementOversightPage() {
  await requireAdmin("/admin/csr-settlements");
  const { data: settlements } = await createAdminClient()
    .from("csr_settlements")
    .select("id, corporate_id, amount_paise, status, created_at")
    .order("created_at", { ascending: false });

  return (
    <main className="page-frame">
      <section className="page-content max-w-5xl">
        <PageHeader
          eyebrow="Admin workspace"
          title="CSR settlement oversight"
          description="Monitor corporate matching batches and their settlement status."
        />
        <div className="mt-8 space-y-3">
          {settlements?.length ? (
            settlements.map((settlement) => (
              <article key={settlement.id} className="panel p-5">
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
            <EmptyState
              title="No CSR settlement batches yet"
              description="Corporate matching settlements will appear here once they are created."
            />
          )}
        </div>
      </section>
    </main>
  );
}
