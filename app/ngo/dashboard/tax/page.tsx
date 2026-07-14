import { redirect } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { financialYearForDate } from "@/lib/domain/financial-year";

export default async function NgoTaxPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/ngo/dashboard/tax");
  if (!user.email_confirmed_at) {
    redirect("/check-email?type=signup");
  }
  const { data: ngo } = await supabase
    .from("ngos")
    .select("id, name, tax_exemption_80g")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!ngo) redirect("/ngo/profile");
  const currentFinancialYear = financialYearForDate(new Date());

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <section className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-8">
        <h1 className="text-3xl font-bold text-[#10214e]">80G tax records</h1>
        <p className="mt-4 text-slate-700">
          Export encrypted donor identity and captured donation records to
          prepare Form 10BD filing data, then map the official Form 10BE PDF
          issued through the Income Tax portal. Use the portal&apos;s latest
          template for filing; DaanSetu does not claim this preparation CSV is
          the official upload template and never manufactures certificates.
        </p>
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          Form 10BE upload is{" "}
          {ngo.tax_exemption_80g
            ? "available after NGO verification"
            : "disabled until 80G eligibility is verified"}
          . The statutory filing deadline is May 31 following the relevant
          financial year.
        </div>
        {ngo.tax_exemption_80g && (
          <Link
            href={`/ngo/dashboard/tax/10bd?financialYear=${currentFinancialYear}`}
            className="btn btn-primary mt-6"
          >
            Export 10BD preparation data for {currentFinancialYear}
          </Link>
        )}
      </section>
    </main>
  );
}
