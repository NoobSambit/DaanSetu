import { notFound } from "next/navigation";

import { createCampaignUpdateFormAction } from "@/app/campaigns/actions";
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
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <section className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-[#10214e]">
          Updates for {campaign.title}
        </h1>
        {user?.id === campaign.creator_id && user?.email_confirmed_at && (
          <form
            action={createCampaignUpdateFormAction}
            className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-6"
          >
            <input name="campaignId" type="hidden" value={campaign.id} />
            <label className="block text-sm font-semibold text-blue-950">
              Share progress with supporters
              <textarea
                className="mt-2 min-h-32 w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-slate-900"
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
              <article
                key={update.id}
                className="rounded-2xl border border-slate-200 bg-white p-6"
              >
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
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
              No campaign updates have been published yet.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
