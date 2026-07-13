import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

const operations = [
  ["NGO verification", "/admin/ngo-verifications"],
  ["Fundraiser review", "/admin/fundraisers"],
  ["Moderation", "/admin/moderation"],
  ["Refund review", "/admin/refunds"],
  ["Payout activation", "/admin/payouts"],
  ["CSR settlement oversight", "/admin/csr-settlements"],
  ["Audit logs", "/admin/audit"],
] as const;

export default async function AdminOperationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/admin/operations");
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/dashboard");
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <section className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold text-[#10214e]">
          Platform operations
        </h1>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {operations.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="rounded-2xl border border-slate-200 bg-white p-6 font-semibold text-slate-900 shadow-sm transition hover:border-blue-300"
            >
              {label}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
