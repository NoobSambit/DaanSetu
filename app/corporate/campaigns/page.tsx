"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BriefcaseBusiness, Plus, Target } from "lucide-react";
import { useRouter } from "next/navigation";

import { EmptyState, PageHeader } from "@/components/ui/PagePrimitives";
import { createClient } from "@/lib/supabase/client";
import { getCorporateProfile } from "@/lib/services/corporate";
import { getCorporateCampaignsByCorporate } from "@/lib/services/corporate-campaigns";
import type { CorporateCampaign } from "@/lib/types/database.types";

function formatPaise(amountPaise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amountPaise / 100);
}

function getProgress(campaign: CorporateCampaign) {
  const goal = Number(campaign.goal_paise);
  if (goal <= 0) return 0;
  return Math.min(100, (Number(campaign.raised_paise) / goal) * 100);
}

function getDaysRemaining(deadline: string) {
  const diff = new Date(deadline).getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function campaignStatusClass(status: CorporateCampaign["status"]) {
  if (status === "active") return "bg-emerald-50 text-emerald-800";
  if (status === "completed") return "bg-slate-100 text-slate-700";
  return "bg-red-50 text-red-700";
}

export default function CorporateCampaignsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<CorporateCampaign[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    void loadCampaigns();
  }, []);

  async function loadCampaigns() {
    try {
      setLoadError(null);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/sign-in?next=/corporate/campaigns");
        return;
      }

      const profile = await getCorporateProfile();
      if (!profile) {
        router.push("/corporate/profile");
        return;
      }

      setCampaigns(await getCorporateCampaignsByCorporate(profile.id));
    } catch (error) {
      console.error("Error loading campaigns:", error);
      setLoadError("Campaigns could not be loaded. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="page-frame flex items-center justify-center">
        <p className="text-sm font-medium text-slate-600" role="status">
          Loading your CSR campaigns…
        </p>
      </main>
    );
  }

  return (
    <main className="page-frame">
      <div className="page-content">
        <PageHeader
          eyebrow="Corporate workspace"
          title="CSR campaigns"
          description="Create, track, and review the initiatives your company is backing."
          actions={
            <Link
              className="btn btn-primary"
              href="/corporate/campaigns/create"
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              Create campaign
            </Link>
          }
        />

        {loadError ? (
          <section className="panel max-w-2xl p-6" aria-live="polite">
            <h2 className="text-lg font-bold text-slate-900">
              We could not load your campaigns
            </h2>
            <p className="mt-2 text-sm text-slate-600">{loadError}</p>
            <button className="btn btn-secondary mt-5" onClick={loadCampaigns}>
              Try again
            </button>
          </section>
        ) : campaigns.length === 0 ? (
          <EmptyState
            icon={<BriefcaseBusiness className="h-5 w-5" />}
            title="No CSR campaigns yet"
            description="Create a campaign to set a clear goal, coordinate partners, and show employees the progress they are enabling."
            action={
              <Link
                className="btn btn-primary"
                href="/corporate/campaigns/create"
              >
                <Plus aria-hidden="true" className="h-4 w-4" />
                Create your first campaign
              </Link>
            }
          />
        ) : (
          <section
            className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
            aria-label="Corporate campaigns"
          >
            {campaigns.map((campaign) => {
              const progress = getProgress(campaign);
              const daysRemaining = getDaysRemaining(campaign.deadline);

              return (
                <article
                  className="panel group overflow-hidden"
                  key={campaign.id}
                >
                  {campaign.image_url ? (
                    <img
                      alt={campaign.title}
                      className="h-44 w-full object-cover"
                      src={campaign.image_url}
                    />
                  ) : (
                    <div className="flex h-44 items-center justify-center bg-[var(--primary-light)] text-[var(--primary)]">
                      <Target className="h-8 w-8" aria-hidden="true" />
                    </div>
                  )}
                  <div className="p-5 sm:p-6">
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold capitalize text-blue-800">
                        {campaign.cause}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${campaignStatusClass(campaign.status)}`}
                      >
                        {campaign.status}
                      </span>
                    </div>
                    <h2 className="mt-4 text-xl font-bold text-slate-900">
                      {campaign.title}
                    </h2>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                      {campaign.description}
                    </p>

                    <div className="mt-5">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium text-slate-600">
                          Progress
                        </span>
                        <span className="font-bold text-slate-900">
                          {progress.toFixed(0)}%
                        </span>
                      </div>
                      <div
                        aria-label={`${progress.toFixed(0)}% of campaign goal reached`}
                        aria-valuemax={100}
                        aria-valuemin={0}
                        aria-valuenow={Math.round(progress)}
                        className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"
                        role="progressbar"
                      >
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-200 pt-4 text-sm">
                      <div>
                        <dt className="text-slate-500">Raised</dt>
                        <dd className="mt-1 font-bold text-slate-900">
                          {formatPaise(Number(campaign.raised_paise))}
                        </dd>
                      </div>
                      <div className="text-right">
                        <dt className="text-slate-500">Goal</dt>
                        <dd className="mt-1 font-bold text-slate-900">
                          {formatPaise(Number(campaign.goal_paise))}
                        </dd>
                      </div>
                    </dl>
                    <div className="mt-5 flex items-center justify-between gap-3">
                      <p className="text-xs font-medium text-slate-500">
                        {daysRemaining > 0
                          ? `${daysRemaining} days remaining`
                          : "Campaign ended"}
                      </p>
                      <Link
                        className="inline-flex items-center gap-1 text-sm font-bold text-blue-700 transition-colors hover:text-blue-900"
                        href={`/corporate/campaigns/${campaign.id}`}
                      >
                        Review
                        <ArrowRight aria-hidden="true" className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
