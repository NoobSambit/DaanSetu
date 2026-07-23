import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { EmptyState, PageHeader } from "@/components/ui/PagePrimitives";

export default async function AuditLogPage() {
  await requireAdmin("/admin/audit");
  const { data: entries } = await createAdminClient()
    .from("audit_logs")
    .select("id, action, entity_type, entity_id, user_id, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <main className="page-frame">
      <section className="page-content max-w-5xl">
        <PageHeader
          eyebrow="Admin workspace"
          title="Security audit log"
          description="The most recent platform actions recorded for traceability and review."
        />
        <div className="panel overflow-hidden">
          {entries?.length ? (
            <ul className="divide-y divide-slate-200">
              {entries.map((entry) => (
                <li key={entry.id} className="p-4">
                  <p className="font-semibold text-slate-900">{entry.action}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {entry.entity_type ?? "platform"} · {entry.created_at}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              className="border-0"
              title="No audit entries yet"
              description="Recorded platform actions will appear here."
            />
          )}
        </div>
      </section>
    </main>
  );
}
