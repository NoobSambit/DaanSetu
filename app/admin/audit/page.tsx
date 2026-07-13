import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AuditLogPage() {
  await requireAdmin("/admin/audit");
  const { data: entries } = await createAdminClient()
    .from("audit_logs")
    .select("id, action, entity_type, entity_id, user_id, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <section className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold text-[#10214e]">
          Security audit log
        </h1>
        <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white">
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
            <p className="p-8 text-center text-slate-600">
              No audit entries have been recorded.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
