import Link from "next/link";
import { redirect } from "next/navigation";

import {
  submitVolunteerHoursFormAction,
  withdrawVolunteerApplicationFormAction,
} from "@/app/volunteer/actions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function VolunteerDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/volunteer/dashboard");

  const [
    { data: profile },
    { data: applications },
    { data: hours },
    { data: skillVerifications },
    { data: certificates },
  ] = await Promise.all([
    supabase
      .from("volunteer_profiles")
      .select(
        "id, bio, city, skills, availability, total_hours, verified_skills",
      )
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("volunteer_applications")
      .select(
        "id, status, message, applied_at, opportunity:volunteer_opportunities(id, ngo_id, title, date, city, ngo:ngos(id, name, display_name))",
      )
      .eq("user_id", user.id)
      .order("applied_at", { ascending: false }),
    supabase
      .from("volunteer_hours")
      .select(
        "id, opportunity_id, hours, date, description, status, review_note, created_at",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("skill_verifications")
      .select(
        "id, skill, verification_type, verified_at, verifier:users!skill_verifications_verified_by_fkey(name)",
      )
      .eq("user_id", user.id)
      .order("verified_at", { ascending: false }),
    supabase
      .from("volunteer_certificates")
      .select(
        "id, certificate_number, hours_completed, issue_date, opportunity:volunteer_opportunities(title), ngo:ngos(name)",
      )
      .eq("user_id", user.id)
      .order("issue_date", { ascending: false }),
  ]);

  if (!profile) redirect("/volunteer/profile");
  const totalApprovedHours = (hours ?? [])
    .filter((entry) => entry.status === "approved")
    .reduce((total, entry) => total + Number(entry.hours), 0);

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <section className="mx-auto max-w-6xl px-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-blue-700">
              Volunteer account
            </p>
            <h1 className="mt-2 text-4xl font-bold text-slate-950">
              My participation
            </h1>
            <p className="mt-2 text-slate-600">
              Applications, approved service, verified skills, and certificates
              from real records.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/volunteer/profile" className="btn btn-secondary">
              Edit profile
            </Link>
            <Link href="/volunteer/opportunities" className="btn btn-primary">
              Find opportunities
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-500">Approved hours</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">
              {totalApprovedHours.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-500">Verified skills</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">
              {skillVerifications?.length ?? 0}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-500">Certificates</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">
              {certificates?.length ?? 0}
            </p>
          </div>
        </div>

        <h2 className="mt-12 text-2xl font-bold text-slate-950">
          Applications
        </h2>
        <div className="mt-5 space-y-4">
          {applications?.length ? (
            applications.map((application) => {
              const opportunity = application.opportunity as unknown as {
                id: string;
                ngo_id: string;
                title: string;
                date: string;
                city: string;
                ngo: { name: string; display_name: string | null };
              };
              const submittedHours = (hours ?? []).filter(
                (entry) => entry.opportunity_id === opportunity.id,
              );
              return (
                <article
                  key={application.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-wrap justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-slate-950">
                        {opportunity.title}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {opportunity.ngo.display_name ?? opportunity.ngo.name} ·{" "}
                        {opportunity.city}
                      </p>
                    </div>
                    <span className="capitalize text-sm font-bold text-blue-800">
                      {application.status}
                    </span>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
                    {application.message}
                  </p>
                  {["submitted", "shortlisted"].includes(
                    application.status,
                  ) && (
                    <form
                      action={withdrawVolunteerApplicationFormAction}
                      className="mt-4"
                    >
                      <input
                        type="hidden"
                        name="applicationId"
                        value={application.id}
                      />
                      <button className="btn btn-secondary">
                        Withdraw application
                      </button>
                    </form>
                  )}
                  {application.status === "accepted" && (
                    <details className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <summary className="cursor-pointer font-semibold text-emerald-950">
                        Submit completed hours
                      </summary>
                      <form
                        action={submitVolunteerHoursFormAction}
                        className="mt-4 grid gap-3 sm:grid-cols-2"
                      >
                        <input
                          type="hidden"
                          name="opportunityId"
                          value={opportunity.id}
                        />
                        <label className="text-sm font-semibold">
                          Service date
                          <input
                            type="date"
                            name="date"
                            required
                            className="input mt-2"
                          />
                        </label>
                        <label className="text-sm font-semibold">
                          Hours
                          <input
                            type="number"
                            name="hours"
                            min="0.25"
                            max="24"
                            step="0.25"
                            required
                            className="input mt-2"
                          />
                        </label>
                        <label className="text-sm font-semibold sm:col-span-2">
                          Work completed
                          <textarea
                            name="description"
                            minLength={10}
                            maxLength={1000}
                            required
                            rows={3}
                            className="input mt-2"
                          />
                        </label>
                        <button className="btn btn-primary sm:col-span-2">
                          Submit hours for approval
                        </button>
                      </form>
                    </details>
                  )}
                  {submittedHours.length > 0 && (
                    <p className="mt-4 text-sm text-slate-600">
                      {submittedHours.length} hour submission(s) recorded for
                      this opportunity.
                    </p>
                  )}
                </article>
              );
            })
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
              You have not applied to an opportunity yet.
            </p>
          )}
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          <section>
            <h2 className="text-2xl font-bold text-slate-950">
              Verified skills
            </h2>
            <div className="mt-5 space-y-3">
              {skillVerifications?.length ? (
                skillVerifications.map((verification) => {
                  const verifier = verification.verifier as unknown as {
                    name: string;
                  } | null;
                  return (
                    <div
                      key={verification.id}
                      className="rounded-xl border border-slate-200 bg-white p-4"
                    >
                      <p className="font-bold text-slate-900">
                        {verification.skill}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        NGO endorsement
                        {verifier?.name ? ` by ${verifier.name}` : ""}
                      </p>
                    </div>
                  );
                })
              ) : (
                <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-slate-600">
                  Approved service will add verified skills here.
                </p>
              )}
            </div>
          </section>
          <section>
            <h2 className="text-2xl font-bold text-slate-950">Certificates</h2>
            <div className="mt-5 space-y-3">
              {certificates?.length ? (
                certificates.map((certificate) => {
                  const opportunity = certificate.opportunity as unknown as {
                    title: string;
                  };
                  const ngo = certificate.ngo as unknown as { name: string };
                  return (
                    <a
                      key={certificate.id}
                      href={`/api/volunteer-certificates/${certificate.id}`}
                      className="block rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-300"
                    >
                      <p className="font-bold text-slate-900">
                        {opportunity.title}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {ngo.name} · {Number(certificate.hours_completed)} hours
                        · {certificate.certificate_number}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-blue-700">
                        Download PDF
                      </p>
                    </a>
                  );
                })
              ) : (
                <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-slate-600">
                  Certificates appear after an NGO approves submitted hours.
                </p>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
