import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  createCampaignMilestoneFormAction,
  deleteCampaignMilestoneFormAction,
  transitionCampaignFormAction,
  updateCampaignDraftFormAction,
} from "@/app/campaigns/[id]/manage/actions";
import { createClient } from "@/lib/supabase/server";

const categories = [
  "education",
  "food",
  "health",
  "women",
  "animals",
  "disaster",
] as const;

function formatRupees(paise: number) {
  return (paise / 100).toFixed(2);
}

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
      "id, ngo_id, payout_account_id, title, short_description, description, status, target_paise, raised_paise, deadline, image_url, category, creator_id, beneficiary, evidence, moderation_notes",
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

  const [{ data: milestones }, { data: payoutAccount }] = await Promise.all([
    supabase
      .from("campaign_milestones")
      .select(
        "id, title, description, target_paise, achieved, achieved_at, milestone_order",
      )
      .eq("campaign_id", id)
      .order("milestone_order"),
    campaign.payout_account_id
      ? supabase
          .from("payout_accounts")
          .select("beneficiary, status")
          .eq("id", campaign.payout_account_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const beneficiary =
    campaign.beneficiary && typeof campaign.beneficiary === "object"
      ? (campaign.beneficiary as {
          name?: string;
          relationship?: string;
        })
      : {};
  const payoutBeneficiary =
    payoutAccount?.beneficiary && typeof payoutAccount.beneficiary === "object"
      ? (payoutAccount.beneficiary as { recipientEmail?: string })
      : {};
  const canEdit =
    campaign.creator_id === user.id &&
    ["draft", "changes_requested"].includes(campaign.status);

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
        {canEdit && (
          <form
            action={updateCampaignDraftFormAction}
            className="mt-8 space-y-5 rounded-2xl border border-slate-200 p-6"
          >
            <input type="hidden" name="campaignId" value={campaign.id} />
            <div>
              <h2 className="text-xl font-bold text-[#10214e]">
                Edit campaign draft
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Changes remain private until the fundraiser passes review.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-800">
                Title
                <input
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
                  defaultValue={campaign.title}
                  minLength={5}
                  maxLength={100}
                  name="title"
                  required
                />
              </label>
              <label className="text-sm font-semibold text-slate-800">
                Category
                <select
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
                  defaultValue={campaign.category}
                  name="category"
                  required
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category.replaceAll("-", " ")}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block text-sm font-semibold text-slate-800">
              Short description
              <input
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
                defaultValue={campaign.short_description}
                minLength={10}
                maxLength={200}
                name="shortDescription"
                required
              />
            </label>
            <label className="block text-sm font-semibold text-slate-800">
              Full story
              <textarea
                className="mt-2 min-h-40 w-full rounded-lg border border-slate-300 px-3 py-2"
                defaultValue={campaign.description}
                minLength={30}
                maxLength={10_000}
                name="description"
                required
              />
            </label>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-800">
                Goal (₹)
                <input
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
                  defaultValue={formatRupees(campaign.target_paise)}
                  min="100"
                  name="goalAmount"
                  required
                  step="0.01"
                  type="number"
                />
              </label>
              <label className="text-sm font-semibold text-slate-800">
                Deadline
                <input
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
                  defaultValue={campaign.deadline.slice(0, 10)}
                  name="deadline"
                  required
                  type="date"
                />
              </label>
            </div>
            <label className="block text-sm font-semibold text-slate-800">
              Public image URL
              <input
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
                defaultValue={campaign.image_url ?? ""}
                name="imageUrl"
                type="url"
              />
            </label>
            {campaign.ngo_id === null && (
              <fieldset className="space-y-4 rounded-xl border border-amber-200 bg-amber-50 p-5">
                <legend className="px-2 font-semibold text-amber-950">
                  Beneficiary and payout details
                </legend>
                <label className="block text-sm font-semibold text-amber-950">
                  Beneficiary name
                  <input
                    className="mt-2 w-full rounded-lg border border-amber-300 bg-white px-3 py-2"
                    defaultValue={beneficiary.name ?? ""}
                    name="beneficiaryName"
                    required
                  />
                </label>
                <label className="block text-sm font-semibold text-amber-950">
                  Your relationship to the beneficiary
                  <input
                    className="mt-2 w-full rounded-lg border border-amber-300 bg-white px-3 py-2"
                    defaultValue={beneficiary.relationship ?? ""}
                    name="beneficiaryRelationship"
                    required
                  />
                </label>
                <label className="block text-sm font-semibold text-amber-950">
                  PayPal recipient email
                  <input
                    className="mt-2 w-full rounded-lg border border-amber-300 bg-white px-3 py-2"
                    defaultValue={payoutBeneficiary.recipientEmail ?? ""}
                    name="payoutEmail"
                    required
                    type="email"
                  />
                </label>
                <p className="text-xs text-amber-900">
                  Payout account status: {payoutAccount?.status ?? "not linked"}
                </p>
              </fieldset>
            )}
            <label className="block text-sm font-semibold text-slate-800">
              Add beneficiary evidence
              <input
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                className="mt-2 block w-full text-sm"
                name="evidence"
                type="file"
              />
              <span className="mt-1 block text-xs font-normal text-slate-500">
                Encrypted PDF, JPG, or PNG up to 10 MB. Existing files:{" "}
                {Array.isArray(campaign.evidence)
                  ? campaign.evidence.length
                  : 0}
              </span>
            </label>
            <button className="btn btn-primary" type="submit">
              Save campaign draft
            </button>
          </form>
        )}
        <section className="mt-8 rounded-2xl border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-[#10214e]">Milestones</h2>
          <div className="mt-4 space-y-3">
            {milestones?.length ? (
              milestones.map((milestone) => (
                <article
                  className="flex flex-col justify-between gap-3 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center"
                  key={milestone.id}
                >
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {milestone.title}
                    </h3>
                    {milestone.description && (
                      <p className="mt-1 text-sm text-slate-600">
                        {milestone.description}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-slate-500">
                      ₹{formatRupees(milestone.target_paise)} ·{" "}
                      {milestone.achieved ? "achieved" : "in progress"}
                    </p>
                  </div>
                  {canEdit && (
                    <form action={deleteCampaignMilestoneFormAction}>
                      <input
                        name="campaignId"
                        type="hidden"
                        value={campaign.id}
                      />
                      <input
                        name="milestoneId"
                        type="hidden"
                        value={milestone.id}
                      />
                      <button
                        className="text-sm font-semibold text-red-700"
                        type="submit"
                      >
                        Remove
                      </button>
                    </form>
                  )}
                </article>
              ))
            ) : (
              <p className="text-sm text-slate-600">No milestones added yet.</p>
            )}
          </div>
          {canEdit && (
            <form
              action={createCampaignMilestoneFormAction}
              className="mt-5 grid gap-3 rounded-xl border border-dashed border-slate-300 p-4 sm:grid-cols-2"
            >
              <input name="campaignId" type="hidden" value={campaign.id} />
              <input
                className="rounded-lg border border-slate-300 px-3 py-2"
                maxLength={120}
                minLength={3}
                name="title"
                placeholder="Milestone title"
                required
              />
              <input
                className="rounded-lg border border-slate-300 px-3 py-2"
                max={formatRupees(campaign.target_paise)}
                min="0.01"
                name="targetAmount"
                placeholder="Target in rupees"
                required
                step="0.01"
                type="number"
              />
              <textarea
                className="rounded-lg border border-slate-300 px-3 py-2 sm:col-span-2"
                maxLength={1_000}
                name="description"
                placeholder="What this milestone unlocks (optional)"
              />
              <button className="btn btn-secondary sm:col-span-2" type="submit">
                Add milestone
              </button>
            </form>
          )}
        </section>
        {campaign.creator_id === user.id &&
          ["draft", "changes_requested"].includes(campaign.status) && (
            <form
              action={transitionCampaignFormAction}
              className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-5"
            >
              <input type="hidden" name="campaignId" value={campaign.id} />
              <input type="hidden" name="status" value="pending_review" />
              <p className="text-sm text-blue-900">
                Submit only after beneficiary, evidence, and payout details are
                complete. An admin must approve the fundraiser before it can go
                live.
              </p>
              <button type="submit" className="btn btn-primary mt-4">
                Submit for review
              </button>
            </form>
          )}
        {campaign.creator_id === user.id && campaign.status === "active" && (
          <div className="mt-8 flex flex-wrap gap-3">
            <form action={transitionCampaignFormAction}>
              <input type="hidden" name="campaignId" value={campaign.id} />
              <button
                type="submit"
                name="status"
                value="paused"
                className="btn btn-secondary"
              >
                Pause donations
              </button>
            </form>
            <form action={transitionCampaignFormAction}>
              <input type="hidden" name="campaignId" value={campaign.id} />
              <button
                type="submit"
                name="status"
                value="completed"
                className="btn btn-secondary"
              >
                Mark completed
              </button>
            </form>
          </div>
        )}
        {campaign.creator_id === user.id && campaign.status === "paused" && (
          <form action={transitionCampaignFormAction} className="mt-8">
            <input type="hidden" name="campaignId" value={campaign.id} />
            <button
              type="submit"
              name="status"
              value="active"
              className="btn btn-primary"
            >
              Resume donations
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
