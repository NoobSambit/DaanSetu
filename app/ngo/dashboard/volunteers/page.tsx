import { redirect } from "next/navigation";

import {
  createVolunteerOpportunityFormAction,
  reviewVolunteerApplicationFormAction,
  reviewVolunteerHoursFormAction,
  updateVolunteerOpportunityStatusFormAction,
} from "@/app/ngo/dashboard/volunteers/actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const skills = [
  "Teaching",
  "Medical",
  "Event Support",
  "Fundraising",
  "Logistics",
  "Technical",
  "Other",
] as const;
const availabilityOptions = ["Weekdays", "Weekends", "Flexible"] as const;

export default async function NgoVolunteerDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/ngo/dashboard/volunteers");

  const { data: ngo } = await supabase
    .from("ngos")
    .select("id, name, profile_status")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!ngo || ngo.profile_status !== "published") redirect("/ngo/profile");

  const admin = createAdminClient();
  const { data: opportunities } = await admin
    .from("volunteer_opportunities")
    .select(
      "id, title, description, city, required_skills, availability, date, total_needed, status, created_at",
    )
    .eq("ngo_id", ngo.id)
    .order("created_at", { ascending: false });
  const opportunityIds = (opportunities ?? []).map(
    (opportunity) => opportunity.id,
  );
  const [{ data: applications }, { data: hoursRows }] = await Promise.all([
    opportunityIds.length
      ? admin
          .from("volunteer_applications")
          .select(
            "id, opportunity_id, user_id, message, status, applied_at, user:users!volunteer_applications_user_id_fkey(name, email, volunteer_profiles(bio, city, skills, availability))",
          )
          .in("opportunity_id", opportunityIds)
          .order("applied_at", { ascending: true })
      : Promise.resolve({ data: [] }),
    admin
      .from("volunteer_hours")
      .select(
        "id, user_id, opportunity_id, hours, date, description, status, review_note, created_at, user:users!volunteer_hours_user_id_fkey(name, email), opportunity:volunteer_opportunities(title)",
      )
      .eq("ngo_id", ngo.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <section className="mx-auto max-w-7xl px-4">
        <p className="text-sm font-bold uppercase tracking-wider text-blue-700">
          {ngo.name}
        </p>
        <h1 className="mt-2 text-4xl font-bold text-slate-950">
          Volunteer operations
        </h1>
        <p className="mt-2 text-slate-600">
          Publish opportunities, review applications, and approve completed
          service.
        </p>

        <details className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <summary className="cursor-pointer text-lg font-bold text-slate-950">
            Post a volunteer opportunity
          </summary>
          <form
            action={createVolunteerOpportunityFormAction}
            className="mt-6 grid gap-5 md:grid-cols-2"
          >
            <label className="text-sm font-semibold text-slate-800">
              Title
              <input
                name="title"
                required
                minLength={5}
                maxLength={150}
                className="input mt-2"
              />
            </label>
            <label className="text-sm font-semibold text-slate-800">
              City
              <input
                name="city"
                required
                minLength={2}
                maxLength={100}
                className="input mt-2"
              />
            </label>
            <label className="text-sm font-semibold text-slate-800 md:col-span-2">
              Description
              <textarea
                name="description"
                required
                minLength={30}
                maxLength={5000}
                rows={5}
                className="input mt-2"
              />
            </label>
            <label className="text-sm font-semibold text-slate-800">
              Service date
              <input name="date" type="date" required className="input mt-2" />
            </label>
            <label className="text-sm font-semibold text-slate-800">
              Volunteers needed
              <input
                name="totalNeeded"
                type="number"
                min={1}
                max={10000}
                required
                defaultValue={1}
                className="input mt-2"
              />
            </label>
            <fieldset>
              <legend className="text-sm font-semibold text-slate-800">
                Required skills
              </legend>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {skills.map((skill) => (
                  <label
                    key={skill}
                    className="flex items-center gap-2 text-sm text-slate-700"
                  >
                    <input
                      type="checkbox"
                      name="requiredSkills"
                      value={skill}
                    />
                    {skill}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-sm font-semibold text-slate-800">
                Availability
              </legend>
              <div className="mt-3 space-y-2">
                {availabilityOptions.map((availability) => (
                  <label
                    key={availability}
                    className="flex items-center gap-2 text-sm text-slate-700"
                  >
                    <input
                      type="checkbox"
                      name="availability"
                      value={availability}
                    />
                    {availability}
                  </label>
                ))}
              </div>
            </fieldset>
            <button className="btn btn-primary md:col-span-2">
              Publish opportunity
            </button>
          </form>
        </details>

        <h2 className="mt-10 text-2xl font-bold text-slate-950">
          Opportunities and applicants
        </h2>
        <div className="mt-5 space-y-6">
          {opportunities?.length ? (
            opportunities.map((opportunity) => {
              const opportunityApplications = (applications ?? []).filter(
                (application) => application.opportunity_id === opportunity.id,
              );
              return (
                <article
                  key={opportunity.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-950">
                        {opportunity.title}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {opportunity.city} ·{" "}
                        {new Date(opportunity.date).toLocaleDateString("en-IN")}{" "}
                        · {opportunity.total_needed} needed
                      </p>
                    </div>
                    <form
                      action={updateVolunteerOpportunityStatusFormAction}
                      className="flex gap-2"
                    >
                      <input
                        type="hidden"
                        name="opportunityId"
                        value={opportunity.id}
                      />
                      <select
                        name="status"
                        defaultValue={opportunity.status}
                        className="input py-2"
                      >
                        <option value="active">Active</option>
                        <option value="closed">Closed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <button className="btn btn-secondary">Save</button>
                    </form>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    {opportunity.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {opportunity.required_skills.map((skill: string) => (
                      <span
                        key={skill}
                        className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                  <h4 className="mt-6 border-t border-slate-200 pt-5 font-bold text-slate-900">
                    Applications ({opportunityApplications.length})
                  </h4>
                  <div className="mt-4 space-y-3">
                    {opportunityApplications.length ? (
                      opportunityApplications.map((application) => {
                        const applicant = application.user as unknown as {
                          name: string;
                          email: string;
                          volunteer_profiles?: Array<{
                            city: string;
                            skills: string[];
                            availability: string[];
                          }>;
                        };
                        const volunteerProfile =
                          applicant.volunteer_profiles?.[0];
                        return (
                          <div
                            key={application.id}
                            className="rounded-xl border border-slate-200 p-4"
                          >
                            <div className="flex flex-wrap justify-between gap-3">
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {applicant.name}
                                </p>
                                <p className="text-sm text-slate-500">
                                  {applicant.email}
                                </p>
                                {volunteerProfile && (
                                  <p className="mt-1 text-sm text-slate-600">
                                    {volunteerProfile.city} ·{" "}
                                    {volunteerProfile.skills.join(", ")} ·{" "}
                                    {volunteerProfile.availability.join(", ")}
                                  </p>
                                )}
                              </div>
                              <span className="capitalize text-sm font-bold text-slate-700">
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
                                action={reviewVolunteerApplicationFormAction}
                                className="mt-4 flex flex-wrap gap-2"
                              >
                                <input
                                  type="hidden"
                                  name="applicationId"
                                  value={application.id}
                                />
                                {application.status === "submitted" && (
                                  <button
                                    name="status"
                                    value="shortlisted"
                                    className="btn btn-secondary"
                                  >
                                    Shortlist
                                  </button>
                                )}
                                <button
                                  name="status"
                                  value="accepted"
                                  className="btn btn-primary"
                                >
                                  Accept
                                </button>
                                <button
                                  name="status"
                                  value="rejected"
                                  className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white"
                                >
                                  Reject
                                </button>
                              </form>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-slate-500">
                        No applications yet.
                      </p>
                    )}
                  </div>
                </article>
              );
            })
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
              No volunteer opportunities have been published.
            </p>
          )}
        </div>

        <h2 className="mt-12 text-2xl font-bold text-slate-950">
          Hours awaiting review
        </h2>
        <div className="mt-5 space-y-4">
          {(hoursRows ?? []).filter((row) => row.status === "pending")
            .length ? (
            (hoursRows ?? [])
              .filter((row) => row.status === "pending")
              .map((hours) => {
                const volunteer = hours.user as unknown as {
                  name: string;
                  email: string;
                };
                const opportunity = hours.opportunity as unknown as {
                  title: string;
                };
                return (
                  <article
                    key={hours.id}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-wrap justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-slate-950">
                          {volunteer.name} · {hours.hours} hours
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">
                          {opportunity.title} ·{" "}
                          {new Date(hours.date).toLocaleDateString("en-IN")}
                        </p>
                        <p className="mt-3 text-sm text-slate-700">
                          {hours.description}
                        </p>
                      </div>
                      <form
                        action={reviewVolunteerHoursFormAction}
                        className="min-w-72 space-y-3"
                      >
                        <input type="hidden" name="hoursId" value={hours.id} />
                        <textarea
                          name="note"
                          maxLength={500}
                          rows={2}
                          className="input"
                          placeholder="Review note"
                        />
                        <div className="flex gap-2">
                          <button
                            name="status"
                            value="approved"
                            className="btn btn-primary"
                          >
                            Approve and certify
                          </button>
                          <button
                            name="status"
                            value="rejected"
                            className="btn btn-secondary"
                          >
                            Reject
                          </button>
                        </div>
                      </form>
                    </div>
                  </article>
                );
              })
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
              No hours await review.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
