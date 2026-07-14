import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { reviewNgoVerificationAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function NgoVerificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/admin/ngo-verifications");
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/");

  const { data: submissions } = await supabase
    .from("ngo_verifications")
    .select(
      "*, ngo:ngos(id, name, legal_name, city, state), documents:ngo_verification_documents(id, document_type, original_name, storage_path)",
    )
    .eq("verification_status", "submitted")
    .order("submitted_at", { ascending: true });
  const hydrated = submissions ?? [];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-blue-700">Admin</p>
            <h1 className="text-3xl font-bold text-slate-950">
              NGO verification review
            </h1>
          </div>
          <Link
            href="/admin/analytics"
            className="text-sm font-semibold text-blue-700 hover:underline"
          >
            Back to analytics
          </Link>
        </div>
        <div className="space-y-5">
          {hydrated.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-600">
              No pending verification submissions.
            </div>
          )}
          {hydrated.map((submission: any) => (
            <article
              key={submission.id}
              className="rounded-xl border border-slate-200 bg-white p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-950">
                    {submission.ngo?.name ?? submission.legal_name}
                  </h2>
                  <p className="text-sm text-slate-600">
                    {submission.ngo?.city}, {submission.ngo?.state}
                  </p>
                </div>
                <Link
                  href={`/ngos/${submission.ngo_id}`}
                  className="text-sm font-semibold text-blue-700 hover:underline"
                >
                  Open profile
                </Link>
              </div>
              <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-slate-500">Registration</dt>
                  <dd className="font-medium text-slate-900">
                    {submission.registration_number}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Type</dt>
                  <dd className="font-medium text-slate-900">
                    {submission.registration_type}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">PAN</dt>
                  <dd className="font-medium text-slate-900">
                    {submission.pan_number || "Not provided"}
                  </dd>
                </div>
              </dl>
              <div className="mt-5">
                <h3 className="text-sm font-semibold text-slate-900">
                  Private documents
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {submission.documents.map((document: any) => (
                    <a
                      key={document.id}
                      href={`/api/ngo/verification-documents/${document.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-blue-700 hover:bg-slate-50"
                    >
                      {document.document_type}: {document.original_name}
                    </a>
                  ))}
                </div>
              </div>
              <form
                action={reviewNgoVerificationAction}
                className="mt-6 space-y-3 border-t border-slate-200 pt-5"
              >
                <input
                  type="hidden"
                  name="verificationId"
                  value={submission.id}
                />
                <label
                  htmlFor={`notes-${submission.id}`}
                  className="block text-sm font-semibold text-slate-800"
                >
                  Review notes
                </label>
                <textarea
                  id={`notes-${submission.id}`}
                  name="notes"
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <div className="flex gap-3">
                  <button
                    name="decision"
                    value="changes_requested"
                    className="min-h-11 rounded-lg border border-amber-300 px-5 text-sm font-semibold text-amber-800"
                  >
                    Request changes
                  </button>
                  <button
                    name="decision"
                    value="rejected"
                    className="min-h-11 rounded-lg border border-red-300 px-5 text-sm font-semibold text-red-700"
                  >
                    Reject
                  </button>
                  <button
                    name="decision"
                    value="verified"
                    className="min-h-11 rounded-lg bg-green-600 px-5 text-sm font-semibold text-white"
                  >
                    Approve
                  </button>
                </div>
              </form>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
