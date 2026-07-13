import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export default async function NgoTaxPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/ngo/dashboard/tax");
  const { data: ngo } = await supabase
    .from("ngos")
    .select("id, name, has_80g")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!ngo) redirect("/ngo/profile");

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <section className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-8">
        <h1 className="text-3xl font-bold text-[#10214e]">80G tax records</h1>
        <p className="mt-4 text-slate-700">
          Export captured donor records for Form 10BD filing, then upload and
          map the official Form 10BE PDF issued through the Income Tax portal.
          DaanSetu only accepts the portal-issued certificate and does not
          manufacture statutory certificates.
        </p>
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          Form 10BE upload is{" "}
          {ngo.has_80g
            ? "available after NGO verification"
            : "disabled until 80G eligibility is verified"}
          . The statutory filing deadline is May 31 following the relevant
          financial year.
        </div>
      </section>
    </main>
  );
}
