import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export default async function CampaignUpdatesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, title")
    .eq("id", id)
    .maybeSingle();
  if (!campaign) notFound();

  const { data: updates } = await supabase
    .from("campaign_updates")
    .select("id, title, content, created_at")
    .eq("campaign_id", id)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <section className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-[#10214e]">
          Updates for {campaign.title}
        </h1>
        <div className="mt-8 space-y-4">
          {updates?.length ? (
            updates.map((update) => (
              <article
                key={update.id}
                className="rounded-2xl border border-slate-200 bg-white p-6"
              >
                <h2 className="font-bold text-slate-900">{update.title}</h2>
                <p className="mt-2 whitespace-pre-wrap text-slate-600">
                  {update.content}
                </p>
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
