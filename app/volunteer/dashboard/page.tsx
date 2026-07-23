import Link from "next/link";
import { redirect } from "next/navigation";

import {
  submitVolunteerHoursFormAction,
  withdrawVolunteerApplicationFormAction,
} from "@/app/volunteer/actions";
import {
  EmptyState,
  MetricCard,
  PageHeader,
} from "@/components/ui/PagePrimitives";
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
    <main className="page-frame">
      <section className="page-content">
        <PageHeader
          eyebrow="Volunteer workspace"
          title="My participation"
          description="Applications, approved service, verified skills, and certificates from your real records."
          actions={
            <>
              <Link href="/volunteer/profile" className="btn btn-secondary">
                Edit profile
              </Link>
              <Link href="/volunteer/opportunities" className="btn btn-primary">
                Find opportunities
              </Link>
            </>
          }
        />

        <div className="metric-grid sm:grid-cols-3 xl:grid-cols-3">
          <MetricCard
            label="Approved hours"
            value={totalApprovedHours.toLocaleString("en-IN")}
          />
          <MetricCard
            label="Verified skills"
            value={skillVerifications?.length ?? 0}
          />
          <MetricCard label="Certificates" value={certificates?.length ?? 0} />
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
                <article key={application.id} className="panel p-5 sm:p-6">
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
            <EmptyState
              title="No opportunity applications yet"
              description="Browse volunteering opportunities to begin building your service record."
              action={
                <Link
                  className="btn btn-primary"
                  href="/volunteer/opportunities"
                >
                  Find opportunities
                </Link>
              }
            />
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
                    <div key={verification.id} className="panel p-4">
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
                <EmptyState
                  className="py-7"
                  title="No verified skills yet"
                  description="Approved service and NGO endorsements will appear here."
                />
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
                      className="panel block p-4 transition hover:border-blue-300"
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
                <EmptyState
                  className="py-7"
                  title="No certificates yet"
                  description="Certificates appear when an NGO approves your submitted hours."
                />
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
