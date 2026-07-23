"use client";

import Link from "next/link";
import { Building2, CheckCircle2, Handshake, Send } from "lucide-react";
import { useEffect, useState } from "react";

import { createPartnershipRequestAction } from "@/app/corporate/actions";
import Toast from "@/components/Toast";
import { EmptyState, PageHeader } from "@/components/ui/PagePrimitives";
import {
  getCorporateCampaigns,
  type CorporateCampaignWithProfile,
} from "@/lib/services/corporate-campaigns";
import { getAppliedCorporateCampaignIdsForNgo } from "@/lib/services/partnerships";
import { createClient } from "@/lib/supabase/client";
import type { CorporateCampaignCause } from "@/lib/types/database.types";

type Feedback = {
  message: string;
  type: "success" | "error" | "info";
};

function formatPaise(amountPaise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amountPaise / 100);
}

function progressFor(campaign: CorporateCampaignWithProfile) {
  return Math.min(
    100,
    (Number(campaign.raised_paise) / Number(campaign.goal_paise)) * 100,
  );
}

function daysRemaining(deadline: string) {
  const difference = new Date(deadline).getTime() - Date.now();
  return Math.max(0, Math.ceil(difference / (1000 * 60 * 60 * 24)));
}

export default function CSRCampaignsPage() {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<CorporateCampaignWithProfile[]>(
    [],
  );
  const [userNgoId, setUserNgoId] = useState<string | null>(null);
  const [appliedCampaigns, setAppliedCampaigns] = useState<Set<string>>(
    new Set(),
  );
  const [causeFilter, setCauseFilter] = useState<CorporateCampaignCause | "">(
    "",
  );
  const [draftCampaignId, setDraftCampaignId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [applyingTo, setApplyingTo] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    void loadCampaigns();
  }, [causeFilter]);

  async function loadCampaigns() {
    setLoading(true);
    setLoadError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const ngoResult = user
        ? await supabase
            .from("ngos")
            .select("id")
            .eq("user_id", user.id)
            .eq("profile_status", "published")
            .eq("is_verified", true)
            .maybeSingle()
        : { data: null };
      const ngoId = ngoResult.data?.id ?? null;
      const [campaignData, appliedIds] = await Promise.all([
        getCorporateCampaigns(
          causeFilter ? { cause: causeFilter } : undefined,
          supabase,
        ),
        ngoId
          ? getAppliedCorporateCampaignIdsForNgo(ngoId, supabase)
          : Promise.resolve([]),
      ]);

      setUserNgoId(ngoId);
      setCampaigns(campaignData);
      setAppliedCampaigns(new Set(appliedIds));
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "CSR campaigns could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }

  function openApplication(campaignId: string) {
    if (!userNgoId) {
      setFeedback({
        type: "info",
        message:
          "Only a verified, published NGO profile can request a corporate partnership.",
      });
      return;
    }
    setDraftCampaignId(campaignId);
    setMessage("");
  }

  async function submitApplication(
    event: React.FormEvent<HTMLFormElement>,
    campaignId: string,
  ) {
    event.preventDefault();
    setApplyingTo(campaignId);
    try {
      await createPartnershipRequestAction({
        campaignId,
        message: message.trim() || undefined,
      });
      setAppliedCampaigns((current) => new Set(current).add(campaignId));
      setDraftCampaignId(null);
      setMessage("");
      setFeedback({
        type: "success",
        message: "Partnership request submitted for corporate review.",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "The partnership request could not be submitted.",
      });
    } finally {
      setApplyingTo(null);
    }
  }

  return (
    <main className="page-frame">
      <section className="page-content">
        <PageHeader
          eyebrow="Corporate collaboration"
          title="CSR partnership campaigns"
          description="Explore active corporate initiatives and submit a partnership request from your verified NGO profile."
          actions={
            <Link href="/corporate/dashboard" className="btn btn-secondary">
              Corporate workspace
            </Link>
          }
        />

        <div className="panel mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5">
          <label className="block w-full max-w-xs text-sm font-semibold text-slate-800">
            Filter by cause
            <select
              value={causeFilter}
              onChange={(event) =>
                setCauseFilter(
                  event.target.value as CorporateCampaignCause | "",
                )
              }
              className="input mt-2"
            >
              <option value="">All causes</option>
              <option value="education">Education</option>
              <option value="food">Food security</option>
              <option value="health">Healthcare</option>
              <option value="disaster">Disaster relief</option>
              <option value="women">Women empowerment</option>
              <option value="animals">Animal welfare</option>
              <option value="environment">Environment</option>
            </select>
          </label>
          <p className="text-sm text-slate-600" aria-live="polite">
            {loading
              ? "Loading active CSR campaigns…"
              : `${campaigns.length} active ${campaigns.length === 1 ? "campaign" : "campaigns"}`}
          </p>
        </div>

        {loadError ? (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800"
          >
            {loadError}
          </div>
        ) : loading ? (
          <div className="empty-state" aria-live="polite">
            <p className="empty-state-description">Loading CSR campaigns…</p>
          </div>
        ) : campaigns.length === 0 ? (
          <EmptyState
            title="No active CSR campaigns match this cause"
            description="Change the cause filter or return later as corporate teams publish new initiatives."
            action={
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setCauseFilter("")}
              >
                Clear filter
              </button>
            }
            icon={<Building2 className="h-5 w-5" />}
          />
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {campaigns.map((campaign) => {
              const progress = progressFor(campaign);
              const applied = appliedCampaigns.has(campaign.id);
              const isDraft = draftCampaignId === campaign.id;
              return (
                <article
                  key={campaign.id}
                  className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
                >
                  {campaign.image_url && (
                    <img
                      src={campaign.image_url}
                      alt=""
                      className="h-44 w-full object-cover"
                    />
                  )}
                  <div className="p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold capitalize text-blue-800">
                        {campaign.cause}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {daysRemaining(campaign.deadline)} days left
                      </span>
                    </div>
                    <h2 className="mt-4 text-xl font-bold text-slate-950">
                      {campaign.title}
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-blue-700">
                      {campaign.corporate_profile.company_name}
                    </p>
                    <p className="mt-3 line-clamp-3 text-sm text-slate-600">
                      {campaign.description}
                    </p>

                    <div className="mt-5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-900">
                          {formatPaise(Number(campaign.raised_paise))}
                        </span>
                        <span className="text-slate-500">
                          of {formatPaise(Number(campaign.goal_paise))}
                        </span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-emerald-600"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {applied ? (
                      <p className="mt-5 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        Partnership request submitted
                      </p>
                    ) : isDraft ? (
                      <form
                        className="mt-5 border-t border-slate-200 pt-5"
                        onSubmit={(event) =>
                          submitApplication(event, campaign.id)
                        }
                      >
                        <label className="block text-sm font-semibold text-slate-800">
                          Note for the corporate team{" "}
                          <span className="font-normal text-slate-500">
                            (optional)
                          </span>
                          <textarea
                            value={message}
                            onChange={(event) => setMessage(event.target.value)}
                            className="input mt-2 min-h-24 resize-y"
                            maxLength={1000}
                            placeholder="Briefly explain why your NGO is a strong partner for this initiative."
                          />
                        </label>
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            className="btn btn-ghost flex-1"
                            onClick={() => setDraftCampaignId(null)}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="btn btn-primary flex-1"
                            disabled={applyingTo === campaign.id}
                          >
                            <Send className="h-4 w-4" aria-hidden="true" />
                            {applyingTo === campaign.id
                              ? "Submitting…"
                              : "Send request"}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="mt-5 flex gap-2">
                        <Link
                          href={`/corporate/campaigns/${campaign.id}`}
                          className="btn btn-secondary flex-1"
                        >
                          View details
                        </Link>
                        <button
                          type="button"
                          className="btn btn-primary flex-1"
                          onClick={() => openApplication(campaign.id)}
                        >
                          <Handshake className="h-4 w-4" aria-hidden="true" />
                          Request partnership
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
      {feedback && (
        <Toast
          isVisible
          message={feedback.message}
          type={feedback.type}
          onClose={() => setFeedback(null)}
        />
      )}
    </main>
  );
}
