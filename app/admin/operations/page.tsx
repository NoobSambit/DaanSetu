import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PagePrimitives";

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
    <main className="page-frame">
      <section className="page-content max-w-5xl">
        <PageHeader
          eyebrow="Admin workspace"
          title="Platform operations"
          description="Review trust, finance, safety, and audit workflows from one operational control centre."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {operations.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="panel p-5 font-semibold text-slate-900 transition hover:border-blue-300 sm:p-6"
            >
              {label}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
