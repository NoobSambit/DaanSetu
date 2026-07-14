import Link from "next/link";
import { redirect } from "next/navigation";

import { revokeAllSessionsAction } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AccountSecurityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in?next=/dashboard/security");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <section className="mx-auto max-w-3xl">
        <Link
          className="text-sm font-semibold text-blue-700 hover:text-blue-800"
          href="/dashboard"
        >
          ← Back to dashboard
        </Link>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Account security
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[#10214e]">
            Revoke active sessions
          </h1>
          <p className="mt-3 text-slate-600">
            Sign out this account on every browser and device. You will need to
            sign in again with your current password.
          </p>
          <dl className="mt-6 rounded-xl bg-slate-50 p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Signed-in account
            </dt>
            <dd className="mt-1 text-sm font-medium text-slate-900">
              {user.email ?? "Verified DaanSetu account"}
            </dd>
          </dl>
          <form action={revokeAllSessionsAction} className="mt-6">
            <button
              className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
              type="submit"
            >
              Sign out on all devices
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
