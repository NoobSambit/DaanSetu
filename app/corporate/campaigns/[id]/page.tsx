"use client";

import Link from "next/link";
import { ArrowLeft, Check, Handshake, Target, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { reviewPartnershipRequestAction } from "@/app/corporate/actions";
import Toast from "@/components/Toast";
import {
  EmptyState,
  MetricCard,
  PageHeader,
} from "@/components/ui/PagePrimitives";
import { getCorporateCampaign } from "@/lib/services/corporate-campaigns";
import { getPartnershipRequestsForCampaign } from "@/lib/services/partnerships";
import { createClient } from "@/lib/supabase/client";
import type { CorporateCampaignWithProfile } from "@/lib/services/corporate-campaigns";
import type { PartnershipRequestWithDetails } from "@/lib/services/partnerships";

function formatPaise(amountPaise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amountPaise / 100);
}

function partnershipStatusClass(
  status: PartnershipRequestWithDetails["status"],
) {
  if (status === "pending") return "bg-amber-50 text-amber-800";
  if (status === "accepted") return "bg-emerald-50 text-emerald-800";
  return "bg-red-50 text-red-700";
}

export default function CorporateCampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<CorporateCampaignWithProfile | null>(
    null,
  );
  const [partnerships, setPartnerships] = useState<
    PartnershipRequestWithDetails[]
  >([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  useEffect(() => {
    void loadCampaign();
  }, [params.id]);

  async function loadCampaign() {
    try {
      setLoadError(null);
      const supabase = createClient();
      const [
        {
          data: { user },
        },
        campaignData,
      ] = await Promise.all([
        supabase.auth.getUser(),
        getCorporateCampaign(params.id),
      ]);

      if (!campaignData) {
        router.replace("/corporate/campaigns");
        return;
      }

      setCampaign(campaignData);
      setIsOwner(false);
      setPartnerships([]);

      if (!user) return;
      const { data: profile } = await supabase
        .from("corporate_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile?.id === campaignData.corporate_id) {
        setIsOwner(true);
        setPartnerships(await getPartnershipRequestsForCampaign(params.id));
      }
    } catch (error) {
      console.error("Error loading campaign:", error);
      setLoadError("Campaign details could not be loaded. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePartnershipAction(
    requestId: string,
    action: "accepted" | "rejected",
  ) {
    try {
      setReviewingId(requestId);
      await reviewPartnershipRequestAction({ requestId, status: action });
      await loadCampaign();
      setActionFeedback({
        type: "success",
        message:
          action === "accepted"
            ? "Partnership request accepted."
            : "Partnership request declined.",
      });
    } catch (error) {
      console.error("Error updating partnership:", error);
      setActionFeedback({
        type: "error",
        message:
          "The partnership decision could not be saved. Please try again.",
      });
    } finally {
      setReviewingId(null);
    }
  }

  if (loading) {
    return (
      <main className="page-frame flex items-center justify-center">
        <p className="text-sm font-medium text-slate-600" role="status">
          Loading campaign details…
        </p>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="page-frame">
        <div className="page-content max-w-3xl">
          <EmptyState
            icon={<Target className="h-5 w-5" />}
            title="We could not load this campaign"
            description={loadError}
            action={
              <button className="btn btn-primary" onClick={loadCampaign}>
                Try again
              </button>
            }
          />
        </div>
      </main>
    );
  }

  if (!campaign) return null;

  const goal = Number(campaign.goal_paise);
  const progress =
    goal > 0 ? Math.min(100, (Number(campaign.raised_paise) / goal) * 100) : 0;
  const daysRemaining = Math.max(
    0,
    Math.ceil(
      (new Date(campaign.deadline).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24),
    ),
  );

  return (
    <main className="page-frame">
      <div className="page-content max-w-5xl">
        <Link
          className="mb-5 inline-flex items-center gap-1.5 text-sm font-bold text-blue-700 hover:text-blue-900"
          href="/corporate/campaigns"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          All campaigns
        </Link>
        <PageHeader
          eyebrow={campaign.corporate_profile.company_name}
          title={campaign.title}
          description="Track goal progress and manage incoming NGO partnership requests."
          actions={
            <span className="rounded-full bg-blue-50 px-3 py-2 text-xs font-bold capitalize text-blue-800">
              {campaign.cause}
            </span>
          }
        />

        <article className="panel overflow-hidden">
          {campaign.image_url && (
            <img
              alt={campaign.title}
              className="h-56 w-full object-cover sm:h-72"
              src={campaign.image_url}
            />
          )}
          <div className="p-5 sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-slate-700">
                Campaign progress
              </p>
              <p className="text-sm font-bold text-slate-900">
                {progress.toFixed(0)}%
              </p>
            </div>
            <div
              aria-label={`${progress.toFixed(0)}% of campaign goal reached`}
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={Math.round(progress)}
              className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
            >
              <div
                className="h-full rounded-full bg-blue-600 transition-[width]"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="metric-grid mt-8 sm:grid-cols-3 xl:grid-cols-3">
              <MetricCard
                label="Raised"
                value={formatPaise(Number(campaign.raised_paise))}
              />
              <MetricCard label="Goal" value={formatPaise(goal)} />
              <MetricCard
                label="Days remaining"
                value={daysRemaining}
                detail={
                  daysRemaining
                    ? "Before the campaign deadline"
                    : "Campaign deadline reached"
                }
              />
            </div>

            <section className="mt-8 border-t border-slate-200 pt-7">
              <h2 className="text-xl font-bold text-slate-900">
                What this campaign is about
              </h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700 sm:text-base">
                {campaign.description}
              </p>
            </section>
          </div>
        </article>

        {isOwner && (
          <section className="mt-6 panel p-5 sm:p-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="page-eyebrow">Partner pipeline</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">
                  NGO partnership requests
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Review each request before connecting the initiative to an NGO
                  partner.
                </p>
              </div>
              <p className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                {partnerships.length} request
                {partnerships.length === 1 ? "" : "s"}
              </p>
            </div>

            {partnerships.length === 0 ? (
              <EmptyState
                className="mt-6 py-9"
                icon={<Handshake className="h-5 w-5" />}
                title="No partnership requests yet"
                description="Qualified NGOs will appear here when they request to work on this campaign."
              />
            ) : (
              <div className="mt-6 space-y-4">
                {partnerships.map((partnership) => (
                  <article
                    className="rounded-xl border border-slate-200 p-4 sm:p-5"
                    key={partnership.id}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900">
                          {partnership.ngo.name}
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">
                          {partnership.ngo.category} · Requested{" "}
                          {new Date(partnership.created_at).toLocaleDateString(
                            "en-IN",
                            { day: "numeric", month: "short", year: "numeric" },
                          )}
                        </p>
                      </div>
                      <span
                        className={`w-fit rounded-full px-2.5 py-1 text-xs font-bold capitalize ${partnershipStatusClass(partnership.status)}`}
                      >
                        {partnership.status}
                      </span>
                    </div>
                    {partnership.message && (
                      <p className="mt-4 text-sm leading-6 text-slate-700">
                        {partnership.message}
                      </p>
                    )}
                    {partnership.status === "pending" && (
                      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                        <button
                          className="btn btn-primary"
                          disabled={reviewingId === partnership.id}
                          onClick={() =>
                            handlePartnershipAction(partnership.id, "accepted")
                          }
                          type="button"
                        >
                          <Check aria-hidden="true" className="h-4 w-4" />
                          {reviewingId === partnership.id
                            ? "Saving…"
                            : "Accept request"}
                        </button>
                        <button
                          className="btn btn-secondary"
                          disabled={reviewingId === partnership.id}
                          onClick={() =>
                            handlePartnershipAction(partnership.id, "rejected")
                          }
                          type="button"
                        >
                          <X aria-hidden="true" className="h-4 w-4" />
                          Decline
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
      {actionFeedback && (
        <Toast
          isVisible
          message={actionFeedback.message}
          onClose={() => setActionFeedback(null)}
          type={actionFeedback.type}
        />
      )}
    </main>
  );
}
