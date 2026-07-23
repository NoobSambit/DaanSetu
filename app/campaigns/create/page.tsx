"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createCampaignAction,
  createSupporterCampaignAction,
} from "@/app/campaigns/actions";
import { PageHeader } from "@/components/ui/PagePrimitives";
import { createClient } from "@/lib/supabase/client";
import type { CampaignCategory } from "@/lib/types/database.types";

export default function CreateCampaignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userNGOs, setUserNGOs] = useState<any[]>([]);
  const [campaignOwner, setCampaignOwner] = useState<"ngo" | "supporter">(
    "ngo",
  );
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    ngoId: "",
    title: "",
    shortDescription: "",
    description: "",
    goalAmount: "",
    deadline: "",
    imageUrl: "",
    category: "education" as CampaignCategory,
    beneficiaryName: "",
    beneficiaryRelationship: "",
    payoutEmail: "",
    beneficiaryConsent: false,
  });

  useEffect(() => {
    checkPermissionsAndLoadNGOs();
  }, []);

  const checkPermissionsAndLoadNGOs = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/sign-in?next=/campaigns/create");
      return;
    }

    // Get user's NGOs
    const { data: ngos, error: ngosError } = await supabase
      .from("ngos")
      .select("*")
      .eq("user_id", user.id)
      .eq("profile_status", "published");

    if (ngosError) {
      setError("Failed to load your NGOs");
      setLoading(false);
      return;
    }

    if (!ngos || ngos.length === 0) {
      setCampaignOwner("supporter");
      setLoading(false);
      return;
    }

    setUserNGOs(ngos);
    setFormData((prev) => ({ ...prev, ngoId: ngos[0].id }));
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (
      !formData.title ||
      !formData.shortDescription ||
      !formData.description
    ) {
      setError("Please fill in all required fields");
      return;
    }

    const goalAmount = parseFloat(formData.goalAmount);
    if (!goalAmount || goalAmount <= 0) {
      setError("Please enter a valid goal amount");
      return;
    }

    if (!formData.deadline) {
      setError("Please select a deadline");
      return;
    }

    // Check deadline is in the future
    const deadlineDate = new Date(formData.deadline);
    if (deadlineDate <= new Date()) {
      setError("Deadline must be in the future");
      return;
    }

    setSubmitting(true);

    try {
      const campaign =
        campaignOwner === "ngo"
          ? await createCampaignAction({
              ngoId: formData.ngoId,
              title: formData.title,
              shortDescription: formData.shortDescription,
              description: formData.description,
              goalAmount: goalAmount.toFixed(2),
              deadline: formData.deadline,
              imageUrl: formData.imageUrl || undefined,
              category: formData.category,
            })
          : await createSupporterFundraiser();

      router.push(`/campaigns/${campaign.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create campaign",
      );
      setSubmitting(false);
    }
  };

  const createSupporterFundraiser = async () => {
    if (
      !formData.beneficiaryName.trim() ||
      !formData.beneficiaryRelationship.trim() ||
      !formData.payoutEmail.trim() ||
      !formData.beneficiaryConsent ||
      !evidenceFile
    ) {
      throw new Error(
        "Beneficiary details, consent, payout email, and evidence are required",
      );
    }

    const payload = new FormData();
    payload.set("title", formData.title);
    payload.set("shortDescription", formData.shortDescription);
    payload.set("description", formData.description);
    payload.set("goalAmount", Number(formData.goalAmount).toFixed(2));
    payload.set("deadline", formData.deadline);
    payload.set("imageUrl", formData.imageUrl);
    payload.set("category", formData.category);
    payload.set("beneficiaryName", formData.beneficiaryName);
    payload.set("beneficiaryRelationship", formData.beneficiaryRelationship);
    payload.set("payoutEmail", formData.payoutEmail);
    payload.set("beneficiaryConsent", "true");
    payload.set("evidence", evidenceFile);
    return createSupporterCampaignAction(payload);
  };

  const categories: {
    value: CampaignCategory;
    label: string;
    emoji: string;
  }[] = [
    { value: "education", label: "Education", emoji: "📚" },
    { value: "food", label: "Food", emoji: "🍲" },
    { value: "health", label: "Health", emoji: "🏥" },
    { value: "women", label: "Women", emoji: "👩" },
    { value: "animals", label: "Animals", emoji: "🐾" },
    { value: "disaster", label: "Disaster Relief", emoji: "🆘" },
  ];

  if (loading) {
    return (
      <main className="page-frame flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page-frame">
      <div className="page-content max-w-4xl">
        <PageHeader
          eyebrow="Fundraising"
          title="Create a campaign"
          description="Provide a clear goal, a credible plan, and the evidence needed for a safe review process."
        />

        <form onSubmit={handleSubmit} className="panel space-y-6 p-5 sm:p-8">
          <fieldset>
            <legend className="mb-3 block text-sm font-semibold text-gray-900">
              Fundraiser owner
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={userNGOs.length === 0}
                onClick={() => setCampaignOwner("ngo")}
                className={`rounded-lg border-2 px-4 py-3 text-left font-medium ${
                  campaignOwner === "ngo"
                    ? "border-blue-600 bg-blue-50 text-blue-800"
                    : "border-gray-300 text-gray-700"
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                My published NGO
              </button>
              <button
                type="button"
                onClick={() => setCampaignOwner("supporter")}
                className={`rounded-lg border-2 px-4 py-3 text-left font-medium ${
                  campaignOwner === "supporter"
                    ? "border-blue-600 bg-blue-50 text-blue-800"
                    : "border-gray-300 text-gray-700"
                }`}
              >
                Supporter-led beneficiary fundraiser
              </button>
            </div>
          </fieldset>

          {/* NGO Selection */}
          {campaignOwner === "ngo" && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Select NGO <span className="text-red-600">*</span>
              </label>
              <select
                value={formData.ngoId}
                onChange={(e) =>
                  setFormData({ ...formData, ngoId: e.target.value })
                }
                required
                className="input"
              >
                {userNGOs.map((ngo) => (
                  <option key={ngo.id} value={ngo.id}>
                    {ngo.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {campaignOwner === "supporter" && (
            <fieldset className="space-y-4 rounded-xl border border-amber-200 bg-amber-50 p-5">
              <legend className="px-2 font-semibold text-amber-950">
                Beneficiary verification and payout
              </legend>
              <label className="block text-sm font-semibold text-gray-900">
                Beneficiary name
                <input
                  required
                  value={formData.beneficiaryName}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      beneficiaryName: event.target.value,
                    })
                  }
                  className="input mt-2"
                />
              </label>
              <label className="block text-sm font-semibold text-gray-900">
                Your relationship to the beneficiary
                <input
                  required
                  value={formData.beneficiaryRelationship}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      beneficiaryRelationship: event.target.value,
                    })
                  }
                  className="input mt-2"
                />
              </label>
              <label className="block text-sm font-semibold text-gray-900">
                Beneficiary PayPal email
                <input
                  type="email"
                  required
                  value={formData.payoutEmail}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      payoutEmail: event.target.value,
                    })
                  }
                  className="input mt-2"
                />
              </label>
              <label className="block text-sm font-semibold text-gray-900">
                Consent or identity evidence (PDF, JPG, or PNG; max 10 MB)
                <input
                  type="file"
                  required
                  accept="application/pdf,image/jpeg,image/png"
                  onChange={(event) =>
                    setEvidenceFile(event.target.files?.[0] ?? null)
                  }
                  className="mt-2 block w-full text-sm"
                />
              </label>
              <label className="flex items-start gap-3 text-sm text-gray-800">
                <input
                  type="checkbox"
                  required
                  checked={formData.beneficiaryConsent}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      beneficiaryConsent: event.target.checked,
                    })
                  }
                  className="mt-1"
                />
                I confirm the beneficiary consented to this fundraiser and the
                evidence is authentic. Admin approval and payout activation are
                required before donations can begin.
              </label>
            </fieldset>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Campaign Title <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g., Winter Blanket Drive 2024"
              required
              maxLength={100}
              className="input"
            />
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Short Description <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.shortDescription}
              onChange={(e) =>
                setFormData({ ...formData, shortDescription: e.target.value })
              }
              placeholder="One-line summary of your campaign"
              required
              maxLength={200}
              className="input"
            />
            <p className="text-sm text-gray-500 mt-1">
              {formData.shortDescription.length}/200
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Detailed Description <span className="text-red-600">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Explain your campaign goals, how funds will be used, and why people should support it..."
              required
              rows={8}
              className="input min-h-44 resize-y"
            />
          </div>

          {/* Goal Amount */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Fundraising Goal (₹) <span className="text-red-600">*</span>
            </label>
            <input
              type="number"
              value={formData.goalAmount}
              onChange={(e) =>
                setFormData({ ...formData, goalAmount: e.target.value })
              }
              placeholder="50000"
              required
              min="100"
              className="input"
            />
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Campaign Deadline <span className="text-red-600">*</span>
            </label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) =>
                setFormData({ ...formData, deadline: e.target.value })
              }
              required
              min={new Date().toISOString().split("T")[0]}
              className="input"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Category <span className="text-red-600">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, category: cat.value })
                  }
                  className={`py-3 px-4 rounded-lg border-2 font-medium transition ${
                    formData.category === cat.value
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Image URL (Optional) */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Cover Image URL (Optional)
            </label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) =>
                setFormData({ ...formData, imageUrl: e.target.value })
              }
              placeholder="https://example.com/image.jpg"
              className="input"
            />
            <p className="text-sm text-gray-500 mt-1">
              Recommended: 1200x600px image
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div
              aria-live="polite"
              className="rounded-lg border border-red-200 bg-red-50 p-4"
            >
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={submitting}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
            >
              {submitting ? "Creating Campaign..." : "Create Campaign"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
