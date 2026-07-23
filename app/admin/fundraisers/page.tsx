import { redirect } from "next/navigation";

import { reviewFundraiserFormAction } from "@/app/admin/fundraisers/actions";
import { EmptyState, PageHeader } from "@/components/ui/PagePrimitives";
import { createClient } from "@/lib/supabase/server";

export default async function FundraiserReviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/admin/fundraisers");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select(
      "id, title, short_description, status, target_paise, beneficiary, beneficiary_consent, evidence, created_at",
    )
    .in("status", ["pending_review", "changes_requested", "approved"])
    .order("created_at", { ascending: true });

  return (
    <main className="page-frame">
      <section className="page-content max-w-6xl">
        <PageHeader
          eyebrow="Admin workspace"
          title="Fundraiser review"
          description="Review beneficiary consent, evidence, ownership, and payout readiness before a fundraiser can proceed."
        />
        <div className="mt-8 grid gap-5">
          {campaigns?.length ? (
            campaigns.map((campaign) => (
              <article key={campaign.id} className="panel p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-600">
                      {campaign.status.replaceAll("_", " ")}
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-slate-900">
                      {campaign.title}
                    </h2>
                    <p className="mt-2 text-slate-600">
                      {campaign.short_description}
                    </p>
                  </div>
                  <p className="font-semibold text-[#10214e]">
                    ₹{(campaign.target_paise / 100).toLocaleString("en-IN")}
                  </p>
                </div>
                <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-slate-500">Consent</dt>
                    <dd className="font-semibold">
                      {campaign.beneficiary_consent ? "Provided" : "Missing"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Beneficiary details</dt>
                    <dd className="font-semibold">
                      {Object.keys(campaign.beneficiary ?? {}).length
                        ? "Provided"
                        : "Missing"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Evidence</dt>
                    <dd className="space-y-1 font-semibold">
                      {Array.isArray(campaign.evidence)
                        ? `${campaign.evidence.length} files`
                        : "Review required"}
                      {Array.isArray(campaign.evidence) &&
                        campaign.evidence.map((item, index) => {
                          const evidence = item as { originalName?: string };
                          return (
                            <a
                              key={`${campaign.id}-${index}`}
                              href={`/api/campaign-evidence/${campaign.id}/${index}`}
                              className="block text-blue-700 underline"
                            >
                              Review{" "}
                              {evidence.originalName ?? `file ${index + 1}`}
                            </a>
                          );
                        })}
                    </dd>
                  </div>
                </dl>
                <form
                  action={reviewFundraiserFormAction}
                  className="mt-6 space-y-3 border-t border-slate-200 pt-5"
                >
                  <input type="hidden" name="campaignId" value={campaign.id} />
                  <label className="block text-sm font-semibold text-slate-800">
                    Review note
                    <textarea
                      name="note"
                      required
                      minLength={10}
                      maxLength={1000}
                      rows={3}
                      className="input mt-2"
                      placeholder="Record the evidence and payout checks performed."
                    />
                  </label>
                  {campaign.status === "approved" ? (
                    <button
                      type="submit"
                      name="decision"
                      value="active"
                      className="btn btn-primary"
                    >
                      Activate after payout approval
                    </button>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="submit"
                        name="decision"
                        value="approved"
                        className="btn btn-primary"
                      >
                        Approve
                      </button>
                      <button
                        type="submit"
                        name="decision"
                        value="changes_requested"
                        className="btn btn-secondary"
                      >
                        Request changes
                      </button>
                      <button
                        type="submit"
                        name="decision"
                        value="rejected"
                        className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </form>
              </article>
            ))
          ) : (
            <EmptyState
              title="No fundraisers await review"
              description="Fundraisers requiring beneficiary or payout review will appear here."
            />
          )}
        </div>
      </section>
    </main>
  );
}
