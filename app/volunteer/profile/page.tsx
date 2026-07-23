"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveVolunteerProfileAction } from "@/app/volunteer/profile/actions";
import Toast from "@/components/Toast";
import { PageHeader } from "@/components/ui/PagePrimitives";
import { createClient } from "@/lib/supabase/client";
import {
  getVolunteerProfile,
  VOLUNTEER_SKILLS,
  VOLUNTEER_AVAILABILITY,
} from "@/lib/services/volunteers";
import type { VolunteerProfile } from "@/lib/types/database.types";

export default function VolunteerProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<VolunteerProfile | null>(null);
  const [formData, setFormData] = useState({
    bio: "",
    city: "",
    skills: [] as string[],
    availability: [] as string[],
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
        router.push("/sign-in?next=/volunteer/profile");
        return;
      }

      const existingProfile = await getVolunteerProfile();
      if (existingProfile) {
        setProfile(existingProfile);
        setFormData({
          bio: existingProfile.bio || "",
          city: existingProfile.city,
          skills: existingProfile.skills,
          availability: existingProfile.availability,
        });
      }
    } catch (caught) {
      console.error("Error loading volunteer profile:", caught);
      setError("Your volunteer profile could not be loaded. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const handleSkillToggle = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const handleAvailabilityToggle = (availability: string) => {
    setFormData((prev) => ({
      ...prev,
      availability: prev.availability.includes(availability)
        ? prev.availability.filter((a) => a !== availability)
        : [...prev.availability, availability],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.city.trim()) {
      setError("Enter your city to continue.");
      return;
    }

    if (formData.skills.length === 0) {
      setError("Select at least one skill.");
      return;
    }

    if (formData.availability.length === 0) {
      setError("Select your availability.");
      return;
    }

    setSaving(true);

    try {
      const result = await saveVolunteerProfileAction(formData);
      setProfile((current) =>
        current
          ? current
          : ({ id: result.id, ...formData } as VolunteerProfile),
      );
      setSuccess(
        profile
          ? "Volunteer profile updated. Redirecting to opportunities…"
          : "Volunteer profile created. Redirecting to opportunities…",
      );

      setTimeout(() => {
        router.push("/volunteer/opportunities");
      }, 1500);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "The volunteer profile could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="page-frame flex items-center justify-center">
        <p className="text-sm font-medium text-slate-600" role="status">
          Loading volunteer profile…
        </p>
      </main>
    );
  }

  return (
    <main className="page-frame">
      <div className="page-content max-w-3xl">
        <PageHeader
          eyebrow="Volunteer workspace"
          title={
            profile ? "Volunteer profile" : "Set up your volunteer profile"
          }
          description="Share the skills and availability NGOs need to find the right opportunity for you."
        />
        <form onSubmit={handleSubmit} className="panel p-5 sm:p-8">
          {error && (
            <div
              aria-live="polite"
              className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
            >
              {error}
            </div>
          )}
          <div className="space-y-6">
            {/* Bio */}
            <div>
              <label
                htmlFor="bio"
                className="mb-2 block text-sm font-bold text-slate-800"
              >
                About You
              </label>
              <textarea
                id="bio"
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                rows={4}
                className="input min-h-32 resize-y"
                placeholder="Tell NGOs about yourself and why you want to volunteer..."
              />
            </div>

            {/* City */}
            <div>
              <label
                htmlFor="city"
                className="mb-2 block text-sm font-bold text-slate-800"
              >
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="city"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                className="input"
                placeholder="e.g., Mumbai, Delhi, Bangalore"
                required
              />
            </div>

            {/* Skills */}
            <div>
              <p className="mb-3 text-sm font-bold text-slate-800">
                Skills <span className="text-red-500">*</span>
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {VOLUNTEER_SKILLS.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleSkillToggle(skill)}
                    aria-pressed={formData.skills.includes(skill)}
                    className={`min-h-11 rounded-lg border px-4 py-3 text-left text-sm font-semibold transition-colors ${
                      formData.skills.includes(skill)
                        ? "border-blue-500 bg-blue-50 text-blue-800"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div>
              <p className="mb-3 text-sm font-bold text-slate-800">
                Availability <span className="text-red-500">*</span>
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {VOLUNTEER_AVAILABILITY.map((availability) => (
                  <button
                    key={availability}
                    type="button"
                    onClick={() => handleAvailabilityToggle(availability)}
                    aria-pressed={formData.availability.includes(availability)}
                    className={`min-h-11 rounded-lg border px-4 py-3 text-sm font-semibold transition-colors ${
                      formData.availability.includes(availability)
                        ? "border-blue-500 bg-blue-50 text-blue-800"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {availability}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary"
              >
                {saving
                  ? "Saving..."
                  : profile
                    ? "Update Profile"
                    : "Create Profile"}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
      {success && (
        <Toast isVisible message={success} onClose={() => setSuccess(null)} />
      )}
    </main>
  );
}
