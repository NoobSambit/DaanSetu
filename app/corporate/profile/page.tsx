"use client";

import Link from "next/link";
import { Building2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { saveCorporateProfileAction } from "@/app/corporate/actions";
import { PageHeader } from "@/components/ui/PagePrimitives";
import { createClient } from "@/lib/supabase/client";
import {
  COMPANY_SIZES,
  getCorporateProfile,
  INDUSTRIES,
} from "@/lib/services/corporate";
import type { CorporateSize } from "@/lib/types/database.types";

export default function CorporateProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    companyName: "",
    industry: "",
    companySize: "" as CorporateSize | "",
    description: "",
    website: "",
    logoUrl: "",
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
        router.push("/sign-in?next=/corporate/profile");
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

      const profile = await getCorporateProfile();
      if (profile) {
        setIsEdit(true);
        setFormData({
          companyName: profile.company_name,
          industry: profile.industry,
          companySize: profile.company_size,
          description: profile.description || "",
          website: profile.website || "",
          logoUrl: profile.logo_url || "",
        });
      }
    } catch (caught) {
      console.error("Error checking corporate profile access:", caught);
      setError("We could not load your corporate profile. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (!formData.companySize) throw new Error("Choose your company size.");
      await saveCorporateProfileAction(formData);
      router.push("/corporate/dashboard");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The corporate profile could not be saved. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="page-frame flex items-center justify-center">
        <p className="text-sm font-medium text-slate-600" role="status">
          Loading corporate profile…
        </p>
      </main>
    );
  }

  return (
    <main className="page-frame">
      <div className="page-content max-w-4xl">
        <PageHeader
          eyebrow="Corporate workspace"
          title={isEdit ? "Corporate profile" : "Set up your corporate profile"}
          description={
            isEdit
              ? "Keep your company details current so NGO partners and employees know who is behind each initiative."
              : "Add the core company details required to launch CSR campaigns and invite employees."
          }
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
          <div className="mb-7 flex items-center gap-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-blue-700 shadow-sm">
              <Building2 aria-hidden="true" className="h-5 w-5" />
            </div>
            <p className="text-sm text-blue-900">
              These details power the corporate identity shown across your
              campaigns and matching initiatives.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-bold text-slate-800">
                Company name <span aria-hidden="true">*</span>
              </span>
              <input
                className="input"
                onChange={(event) =>
                  setFormData({ ...formData, companyName: event.target.value })
                }
                placeholder="Company name"
                required
                type="text"
                value={formData.companyName}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-800">
                Industry <span aria-hidden="true">*</span>
              </span>
              <select
                className="input"
                onChange={(event) =>
                  setFormData({ ...formData, industry: event.target.value })
                }
                required
                value={formData.industry}
              >
                <option value="">Select industry</option>
                {INDUSTRIES.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-800">
                Company size <span aria-hidden="true">*</span>
              </span>
              <select
                className="input"
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    companySize: event.target.value as CorporateSize,
                  })
                }
                required
                value={formData.companySize}
              >
                <option value="">Select company size</option>
                {COMPANY_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size} employees
                  </option>
                ))}
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-bold text-slate-800">
                Company description
              </span>
              <textarea
                className="input min-h-32 resize-y"
                onChange={(event) =>
                  setFormData({ ...formData, description: event.target.value })
                }
                placeholder="A short description of your company and its social impact commitments."
                rows={4}
                value={formData.description}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-800">
                Website
              </span>
              <input
                className="input"
                onChange={(event) =>
                  setFormData({ ...formData, website: event.target.value })
                }
                placeholder="https://example.com"
                type="url"
                value={formData.website}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-800">
                Logo URL
              </span>
              <input
                className="input"
                onChange={(event) =>
                  setFormData({ ...formData, logoUrl: event.target.value })
                }
                placeholder="https://example.com/logo.png"
                type="url"
                value={formData.logoUrl}
              />
            </label>
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
            {isEdit && (
              <Link className="btn btn-secondary" href="/corporate/dashboard">
                Cancel
              </Link>
            )}
            <button
              className="btn btn-primary"
              disabled={submitting}
              type="submit"
            >
              <Save aria-hidden="true" className="h-4 w-4" />
              {submitting
                ? "Saving…"
                : isEdit
                  ? "Save profile"
                  : "Create profile"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
