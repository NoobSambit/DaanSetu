"use client";

import { MailPlus, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { inviteCorporateEmployeeAction } from "@/app/corporate/actions";
import { EmptyState, PageHeader } from "@/components/ui/PagePrimitives";
import { createClient } from "@/lib/supabase/client";
import { getCorporateProfile } from "@/lib/services/corporate";
import { getEmployeesByCorporate } from "@/lib/services/corporate-employees";
import type { CorporateEmployee } from "@/lib/types/database.types";

export default function CorporateEmployeesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<CorporateEmployee[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [invitationUrl, setInvitationUrl] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    void loadEmployees();
  }, []);

  async function loadEmployees() {
    try {
      setLoadError(null);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/sign-in?next=/corporate/employees");
        return;
      }

      const profile = await getCorporateProfile();
      if (!profile) {
        router.push("/corporate/profile");
        return;
      }

      setEmployees(await getEmployeesByCorporate(profile.id));
    } catch (caught) {
      console.error("Error loading employees:", caught);
      setLoadError("Employee records could not be loaded. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInvitationUrl(null);
    setSubmitting(true);

    try {
      const result = await inviteCorporateEmployeeAction({ email });
      setEmail("");
      setInvitationUrl(result.invitationUrl);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The invitation could not be created. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="page-frame flex items-center justify-center">
        <p className="text-sm font-medium text-slate-600" role="status">
          Loading employee engagement…
        </p>
      </main>
    );
  }

  return (
    <main className="page-frame">
      <div className="page-content">
        <PageHeader
          eyebrow="Corporate workspace"
          title="Employee engagement"
          description="Invite employees to participate in eligible giving and keep the company’s match programme connected to its people."
          actions={
            <button
              className="btn btn-primary"
              onClick={() => setShowForm((visible) => !visible)}
              type="button"
            >
              <MailPlus aria-hidden="true" className="h-4 w-4" />
              {showForm ? "Close invite" : "Invite employee"}
            </button>
          }
        />

        {showForm && (
          <section
            className="panel mb-6 max-w-2xl p-5 sm:p-6"
            aria-labelledby="invite-employee-title"
          >
            <h2
              className="text-xl font-bold text-slate-900"
              id="invite-employee-title"
            >
              Invite an employee
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              They will receive a secure invitation link for your corporate
              workspace.
            </p>
            {error && (
              <p
                aria-live="polite"
                className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
              >
                {error}
              </p>
            )}
            {invitationUrl && (
              <div
                aria-live="polite"
                className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"
              >
                <p className="font-bold">Invitation created</p>
                <p className="mt-1">
                  In local demo mode, share this link with the invited employee.
                </p>
                <p className="mt-3 break-all rounded-md bg-white/70 p-3 font-mono text-xs text-emerald-900">
                  {invitationUrl}
                </p>
              </div>
            )}
            <form
              className="mt-5 flex flex-col gap-3 sm:flex-row"
              onSubmit={handleSubmit}
            >
              <label className="sr-only" htmlFor="employee-email">
                Employee email
              </label>
              <input
                className="input flex-1"
                id="employee-email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="employee@company.com"
                required
                type="email"
                value={email}
              />
              <button
                className="btn btn-primary shrink-0"
                disabled={submitting}
                type="submit"
              >
                {submitting ? "Creating…" : "Create invitation"}
              </button>
            </form>
          </section>
        )}

        {loadError ? (
          <section className="panel max-w-2xl p-6" aria-live="polite">
            <h2 className="text-lg font-bold text-slate-900">
              We could not load employees
            </h2>
            <p className="mt-2 text-sm text-slate-600">{loadError}</p>
            <button
              className="btn btn-secondary mt-5"
              onClick={loadEmployees}
              type="button"
            >
              Try again
            </button>
          </section>
        ) : employees.length === 0 ? (
          <EmptyState
            icon={<UsersRound className="h-5 w-5" />}
            title="No employees invited yet"
            description="Start by inviting the people who will take part in company-sponsored giving and matching programmes."
            action={
              <button
                className="btn btn-primary"
                onClick={() => setShowForm(true)}
                type="button"
              >
                <MailPlus aria-hidden="true" className="h-4 w-4" /> Invite
                employee
              </button>
            }
          />
        ) : (
          <section
            className="panel overflow-hidden"
            aria-label="Invited employees"
          >
            <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
              <h2 className="text-lg font-bold text-slate-900">
                Invited employees
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {employees.length} employee{employees.length === 1 ? "" : "s"}{" "}
                connected to this workspace.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[650px] w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
                  <tr>
                    <th className="px-5 py-3 sm:px-6">Name</th>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Designation</th>
                    <th className="px-5 py-3 text-right sm:px-6">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {employees.map((employee) => (
                    <tr
                      className="transition-colors hover:bg-slate-50"
                      key={employee.id}
                    >
                      <td className="px-5 py-4 font-bold text-slate-900 sm:px-6">
                        {employee.name}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {employee.email}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {employee.designation || "—"}
                      </td>
                      <td className="px-5 py-4 text-right text-slate-600 sm:px-6">
                        {new Date(employee.joined_at).toLocaleDateString(
                          "en-IN",
                          { day: "numeric", month: "short", year: "numeric" },
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
