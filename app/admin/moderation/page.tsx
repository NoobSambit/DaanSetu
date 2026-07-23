import {
  moderateContentFormAction,
  reviewImpactStoryFormAction,
} from "@/app/admin/moderation/actions";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { EmptyState, PageHeader } from "@/components/ui/PagePrimitives";

export default async function ModerationQueuePage() {
  await requireAdmin("/admin/moderation");
  const admin = createAdminClient();
  const [{ data: reports }, { data: storyCandidates }] = await Promise.all([
    admin
      .from("content_reports")
      .select(
        "id, entity_id, entity_type, reason, description, status, created_at",
      )
      .in("status", ["pending", "reviewing"])
      .order("created_at", { ascending: true }),
    admin
      .from("posts")
      .select(
        "id, title, author_id, approved_at, is_featured, created_at, author:users(name)",
      )
      .eq("category", "story")
      .eq("status", "published")
      .is("hidden_at", null)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  return (
    <main className="page-frame">
      <section className="page-content max-w-5xl">
        <PageHeader
          eyebrow="Admin workspace"
          title="Moderation queue"
          description="Resolve reported content and curate impact stories with a clear decision trail."
        />
        <div className="mt-8 space-y-3">
          {reports?.length ? (
            reports.map((report) => (
              <article key={report.id} className="panel p-5">
                <p className="font-semibold text-slate-900">
                  {report.entity_type} · {report.status}
                </p>
                <p className="mt-2 text-sm text-slate-600">{report.reason}</p>
                {report.description && (
                  <p className="mt-2 text-sm text-slate-700">
                    {report.description}
                  </p>
                )}
                <p className="mt-2 font-mono text-xs text-slate-500">
                  Entity: {report.entity_id}
                </p>
                {["post", "ngo_review"].includes(report.entity_type) ? (
                  <form
                    action={moderateContentFormAction}
                    className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"
                  >
                    <input name="reportId" type="hidden" value={report.id} />
                    <textarea
                      className="input min-h-24 resize-y"
                      maxLength={1_000}
                      minLength={10}
                      name="reason"
                      placeholder="Record the evidence and reason for this decision."
                      required
                    />
                    <div className="flex flex-col gap-2">
                      <button
                        className="btn btn-secondary"
                        name="action"
                        type="submit"
                        value="hide"
                      >
                        Hide
                      </button>
                      <button
                        className="btn btn-secondary"
                        name="action"
                        type="submit"
                        value="restore"
                      >
                        Restore
                      </button>
                      <button
                        className="text-sm font-semibold text-slate-600"
                        name="action"
                        type="submit"
                        value="dismiss"
                      >
                        Dismiss report
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                    This entity type requires a domain-specific review queue.
                  </p>
                )}
              </article>
            ))
          ) : (
            <EmptyState
              title="No reports require moderation"
              description="Reported community content will appear here when it needs review."
            />
          )}
        </div>

        <section className="mt-12">
          <h2 className="text-2xl font-bold text-[#10214e]">
            Impact story approvals
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Community stories remain ordinary posts until an administrator
            explicitly approves them for the public impact feed.
          </p>
          <div className="mt-5 space-y-3">
            {storyCandidates?.length ? (
              storyCandidates.map((story) => {
                const author = Array.isArray(story.author)
                  ? story.author[0]
                  : story.author;
                return (
                  <article className="panel p-5" key={story.id}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-950">
                          {story.title}
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">
                          {author?.name ?? "Community member"} ·{" "}
                          {story.approved_at
                            ? story.is_featured
                              ? "Approved and featured"
                              : "Approved"
                            : "Awaiting approval"}
                        </p>
                      </div>
                      <a
                        className="text-sm font-semibold text-blue-700 hover:underline"
                        href={`/community/${story.id}`}
                      >
                        Review post
                      </a>
                    </div>
                    <form
                      action={reviewImpactStoryFormAction}
                      className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"
                    >
                      <input name="postId" type="hidden" value={story.id} />
                      <textarea
                        className="min-h-20 rounded-lg border border-slate-300 px-3 py-2"
                        maxLength={1_000}
                        minLength={10}
                        name="reason"
                        placeholder="Record why this story is suitable for public impact reporting."
                        required
                      />
                      <div className="flex flex-col gap-2">
                        <button
                          className="btn btn-primary"
                          name="feature"
                          type="submit"
                          value="true"
                        >
                          Approve and feature
                        </button>
                        {story.approved_at && story.is_featured && (
                          <button
                            className="btn btn-secondary"
                            name="feature"
                            type="submit"
                            value="false"
                          >
                            Remove feature
                          </button>
                        )}
                      </div>
                    </form>
                  </article>
                );
              })
            ) : (
              <EmptyState
                className="py-8"
                title="No stories await review"
                description="Published community stories ready for impact curation will appear here."
              />
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
