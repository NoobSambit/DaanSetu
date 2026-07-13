import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export default async function CampaignManagementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/sign-in?next=/campaigns/${id}/manage`);

  const { data: campaign } = await supabase
    .from("campaigns")
    .select(
      "id, title, status, target_paise, raised_paise, creator_id, moderation_notes",
    )
    .eq("id", id)
    .maybeSingle();

  if (!campaign) notFound();

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (campaign.creator_id !== user.id && profile?.role !== "admin") {
    redirect(`/campaigns/${id}`);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <section className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
          Campaign management
        </p>
        <h1 className="mt-2 text-3xl font-bold text-[#10214e]">
          {campaign.title}
        </h1>
        <p className="mt-3 text-slate-600">
          Current state: <strong>{campaign.status.replaceAll("_", " ")}</strong>
        </p>
        {campaign.moderation_notes && (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            Reviewer note: {campaign.moderation_notes}
          </div>
        )}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Link
            className="rounded-xl bg-blue-600 px-4 py-3 text-center font-semibold text-white"
            href={`/campaigns/${id}/updates`}
          >
            Manage updates
          </Link>
          <Link
            className="rounded-xl border border-slate-300 px-4 py-3 text-center font-semibold text-slate-700"
            href={`/campaigns/${id}?preview=1`}
          >
            Preview
          </Link>
          <Link
            className="rounded-xl border border-slate-300 px-4 py-3 text-center font-semibold text-slate-700"
            href={`/campaigns/${id}`}
          >
            Public campaign
          </Link>
        </div>
      </section>
    </main>
  );
}
