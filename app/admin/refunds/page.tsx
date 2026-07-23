import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { reviewRefundAction } from "./actions";
import { EmptyState, PageHeader } from "@/components/ui/PagePrimitives";

export default async function AdminRefundsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/admin/refunds");
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/dashboard");
  const { data: refunds } = await createAdminClient()
    .from("refund_requests")
    .select("id, amount_paise, reason, status, created_at")
    .order("created_at", { ascending: true });
  return (
    <main className="page-frame">
      <section className="page-content max-w-5xl">
        <PageHeader
          eyebrow="Admin workspace"
          title="Refund review"
          description="Assess supporter refund requests with an auditable decision and note."
        />
        <div className="mt-8 space-y-3">
          {refunds?.length ? (
            refunds.map((refund) => (
              <article key={refund.id} className="panel p-5">
                <p className="font-semibold">
                  ₹{(refund.amount_paise / 100).toLocaleString("en-IN")} —{" "}
                  {refund.status}
                </p>
                <p className="mt-2 text-slate-600">{refund.reason}</p>
                {refund.status === "submitted" && (
                  <form action={reviewRefundAction} className="mt-4 space-y-3">
                    <input
                      type="hidden"
                      name="refundRequestId"
                      value={refund.id}
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
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        name="decision"
                        value="approve"
                        className="btn btn-primary"
                      >
                        Approve and refund
                      </button>
                      <button
                        type="submit"
                        name="decision"
                        value="reject"
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
            <EmptyState
              title="No refund requests await review"
              description="New supporter refund requests will appear here."
            />
          )}
        </div>
      </section>
    </main>
  );
}
