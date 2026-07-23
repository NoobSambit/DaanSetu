"use client";

import Link from "next/link";
import { ArrowLeft, ImagePlus, Target } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { createCorporateCampaignAction } from "@/app/corporate/actions";
import { PageHeader } from "@/components/ui/PagePrimitives";
import { createClient } from "@/lib/supabase/client";
import { getCorporateProfile } from "@/lib/services/corporate";
import { CORPORATE_CAMPAIGN_CAUSES } from "@/lib/services/corporate-campaigns";
import type { CorporateCampaignCause } from "@/lib/types/database.types";

export default function CreateCorporateCampaignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    cause: "" as CorporateCampaignCause | "",
    goalAmount: "",
    deadline: "",
    imageUrl: "",
  });

  useEffect(() => {
    void checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/sign-in?next=/corporate/campaigns/create");
        return;
      }

      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (userData?.role !== "corporate") {
        router.push("/dashboard");
        return;
      }

      if (!(await getCorporateProfile())) router.push("/corporate/profile");
    } catch (caught) {
      console.error("Error checking corporate campaign access:", caught);
      setError("We could not confirm your workspace access. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (!formData.cause) throw new Error("Choose the campaign cause.");
      const goalAmount = Number.parseFloat(formData.goalAmount);
      if (!Number.isFinite(goalAmount) || goalAmount <= 0) {
        throw new Error("Enter a valid campaign goal.");
      }

      const campaign = await createCorporateCampaignAction({
        title: formData.title,
        description: formData.description,
        cause: formData.cause,
        goalAmount: goalAmount.toFixed(2),
        deadline: formData.deadline,
        imageUrl: formData.imageUrl,
      });
      router.push(`/corporate/campaigns/${campaign.id}`);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The campaign could not be created. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="page-frame flex items-center justify-center">
        <p className="text-sm font-medium text-slate-600" role="status">
          Preparing your campaign workspace…
        </p>
      </main>
    );
  }

  const minDate = new Date().toISOString().split("T")[0];

  return (
    <main className="page-frame">
      <div className="page-content max-w-4xl">
        <Link
          className="mb-5 inline-flex items-center gap-1.5 text-sm font-bold text-blue-700 hover:text-blue-900"
          href="/corporate/campaigns"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Campaigns
        </Link>
        <PageHeader
          eyebrow="Corporate workspace"
          title="Create a CSR campaign"
          description="Set a concrete goal and deadline so employees and partner NGOs know what this initiative is working toward."
        />

        <form className="panel p-5 sm:p-8" onSubmit={handleSubmit}>
          {error && (
            <div
              aria-live="polite"
              className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
            >
              {error}
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-bold text-slate-800">
                Campaign title <span aria-hidden="true">*</span>
              </span>
              <input
                className="input"
                maxLength={100}
                onChange={(event) =>
                  setFormData({ ...formData, title: event.target.value })
                }
                placeholder="e.g. School access for every learner"
                required
                type="text"
                value={formData.title}
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-bold text-slate-800">
                What will this campaign make possible?{" "}
                <span aria-hidden="true">*</span>
              </span>
              <textarea
                className="input min-h-36 resize-y"
                onChange={(event) =>
                  setFormData({ ...formData, description: event.target.value })
                }
                placeholder="Describe the intended impact, who is served, and how partners can contribute."
                required
                rows={6}
                value={formData.description}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-800">
                Cause <span aria-hidden="true">*</span>
              </span>
              <select
                className="input"
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    cause: event.target.value as CorporateCampaignCause,
                  })
                }
                required
                value={formData.cause}
              >
                <option value="">Select a cause</option>
                {CORPORATE_CAMPAIGN_CAUSES.map((cause) => (
                  <option key={cause} value={cause}>
                    {cause.charAt(0).toUpperCase() + cause.slice(1)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-800">
                Goal amount (INR) <span aria-hidden="true">*</span>
              </span>
              <input
                className="input"
                min="1"
                onChange={(event) =>
                  setFormData({ ...formData, goalAmount: event.target.value })
                }
                placeholder="500000"
                required
                step="0.01"
                type="number"
                value={formData.goalAmount}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-800">
                Campaign deadline <span aria-hidden="true">*</span>
              </span>
              <input
                className="input"
                min={minDate}
                onChange={(event) =>
                  setFormData({ ...formData, deadline: event.target.value })
                }
                required
                type="date"
                value={formData.deadline}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-800">
                Cover image URL{" "}
                <span className="font-medium text-slate-500">(optional)</span>
              </span>
              <input
                className="input"
                onChange={(event) =>
                  setFormData({ ...formData, imageUrl: event.target.value })
                }
                placeholder="https://example.com/initiative.jpg"
                type="url"
                value={formData.imageUrl}
              />
            </label>
          </div>

          {formData.imageUrl && (
            <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 text-sm font-bold text-slate-700">
                <ImagePlus aria-hidden="true" className="h-4 w-4" />
                Cover preview
              </div>
              <img
                alt="Selected campaign cover preview"
                className="h-52 w-full object-cover"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
                src={formData.imageUrl}
              />
            </div>
          )}

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
            <Link className="btn btn-secondary" href="/corporate/campaigns">
              Cancel
            </Link>
            <button
              className="btn btn-primary"
              disabled={submitting}
              type="submit"
            >
              <Target aria-hidden="true" className="h-4 w-4" />
              {submitting ? "Creating campaign…" : "Create campaign"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
