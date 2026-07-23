import { notFound } from "next/navigation";

import { createCampaignUpdateFormAction } from "@/app/campaigns/actions";
import { EmptyState, PageHeader } from "@/components/ui/PagePrimitives";
import { createClient } from "@/lib/supabase/server";

export default async function CampaignUpdatesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, title, creator_id")
    .eq("id", id)
    .maybeSingle();
  if (!campaign) notFound();

  const { data: updates } = await supabase
    .from("campaign_updates")
    .select("id, text, image_url, created_at")
    .eq("campaign_id", id)
    .order("created_at", { ascending: false });

  return (
    <main className="page-frame">
      <section className="page-content max-w-3xl">
        <PageHeader
          eyebrow="Campaign management"
          title={`Updates for ${campaign.title}`}
          description="Publish concise, honest progress notes so supporters understand what changed and what comes next."
        />
        {user?.id === campaign.creator_id && user?.email_confirmed_at && (
          <form
            action={createCampaignUpdateFormAction}
            className="panel mt-8 border-blue-200 bg-blue-50 p-5 sm:p-6"
          >
            <input name="campaignId" type="hidden" value={campaign.id} />
            <label className="block text-sm font-semibold text-blue-950">
              Share progress with supporters
              <textarea
                className="input mt-2 min-h-32 resize-y"
                maxLength={2_000}
                minLength={10}
                name="text"
                placeholder="Describe what changed, how funds are being used, or what happens next."
                required
              />
            </label>
            <button className="btn btn-primary mt-4" type="submit">
              Publish update
            </button>
          </form>
        )}
        <div className="mt-8 space-y-4">
          {updates?.length ? (
            updates.map((update) => (
              <article key={update.id} className="panel p-5 sm:p-6">
                <time className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {new Date(update.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
                <p className="mt-3 whitespace-pre-wrap text-slate-700">
                  {update.text}
                </p>
                {update.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt="Campaign progress"
                    className="mt-4 max-h-96 w-full rounded-xl object-cover"
                    src={update.image_url}
                  />
                )}
              </article>
            ))
          ) : (
            <EmptyState
              title="No campaign updates yet"
              description="Progress updates will appear here as the campaign team shares them."
            />
          )}
        </div>
      </section>
    </main>
  );
}
