import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function ModerationQueuePage() {
  await requireAdmin("/admin/moderation");
  const { data: reports } = await createAdminClient()
    .from("content_reports")
    .select("id, entity_type, reason, status, created_at")
    .in("status", ["pending", "under_review"])
    .order("created_at", { ascending: true });

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <section className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold text-[#10214e]">Moderation queue</h1>
        <div className="mt-8 space-y-3">
          {reports?.length ? (
            reports.map((report) => (
              <article
                key={report.id}
                className="rounded-xl border border-slate-200 bg-white p-5"
              >
                <p className="font-semibold text-slate-900">
                  {report.entity_type} · {report.status}
                </p>
                <p className="mt-2 text-sm text-slate-600">{report.reason}</p>
              </article>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
              No reports currently require moderation.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
