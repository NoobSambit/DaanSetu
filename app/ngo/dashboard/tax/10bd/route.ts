import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { financialYearRange } from "@/lib/domain/financial-year";
import { decryptSensitiveText } from "@/lib/security/encryption";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";

const querySchema = z.object({
  financialYear: z.string().regex(/^\d{4}-\d{2}$/),
});

function csvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse({
    financialYear: request.nextUrl.searchParams.get("financialYear"),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid financial year" },
      { status: 400 },
    );
  }
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email_confirmed_at) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: ngo } = await supabase
    .from("ngos")
    .select("id, tax_exemption_80g")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!ngo?.tax_exemption_80g) {
    return NextResponse.json(
      { error: "Verified 80G eligibility is required" },
      { status: 403 },
    );
  }
  const { data: verification } = await supabase
    .from("ngo_verifications")
    .select("id")
    .eq("ngo_id", ngo.id)
    .eq("verification_status", "verified")
    .maybeSingle();
  if (!verification) {
    return NextResponse.json(
      { error: "NGO verification is required" },
      { status: 403 },
    );
  }

  let range: ReturnType<typeof financialYearRange>;
  try {
    range = financialYearRange(parsed.data.financialYear);
  } catch {
    return NextResponse.json(
      { error: "Invalid financial year" },
      { status: 400 },
    );
  }
  const { data: donations, error } = await createAdminClient()
    .from("donations")
    .select(
      "user_id, receipt_number, amount_paise, refunded_paise, captured_at, status, is_demo, users(name, email)",
    )
    .eq("ngo_id", ngo.id)
    .in("status", ["captured", "partially_refunded", "refunded"])
    .eq("is_demo", false)
    .gte("captured_at", range.startsAt)
    .lt("captured_at", range.endsBefore)
    .order("captured_at", { ascending: true });
  if (error) {
    return NextResponse.json(
      { error: "Form 10BD data could not be generated" },
      { status: 500 },
    );
  }

  const reportableDonations = (donations ?? []).filter(
    (donation) => donation.amount_paise - donation.refunded_paise > 0,
  );
  const donorIds = [
    ...new Set(reportableDonations.map((donation) => donation.user_id)),
  ];
  const admin = createAdminClient();
  const { data: profiles, error: profileError } = donorIds.length
    ? await admin
        .from("donor_tax_profiles")
        .select("user_id, id_code, identifier_ciphertext, address_ciphertext")
        .in("user_id", donorIds)
    : { data: [], error: null };
  if (profileError) {
    return NextResponse.json(
      { error: "Donor tax profiles could not be loaded" },
      { status: 500 },
    );
  }
  const profilesByDonor = new Map(
    (profiles ?? []).map((profile) => [profile.user_id, profile]),
  );
  const incompleteDonorIds = donorIds.filter(
    (donorId) => !profilesByDonor.has(donorId),
  );
  if (incompleteDonorIds.length > 0) {
    return NextResponse.json(
      {
        error: "Incomplete donor tax profiles prevent a truthful export",
        incompleteDonorCount: incompleteDonorIds.length,
      },
      { status: 409 },
    );
  }

  let rows: unknown[][];
  try {
    rows = [
      [
        "Identification code",
        "Unique identification number",
        "Donor name",
        "Donor address",
        "Donor email (contact only)",
        "Donation date",
        "Gross amount INR",
        "Refunded amount INR",
        "Net amount INR",
        "Receipt number",
        "Record status",
      ],
      ...reportableDonations.map((donation) => {
        const profile = profilesByDonor.get(donation.user_id)!;
        const context = `tax-profile:${donation.user_id}`;
        const donor = donation.users as {
          name?: string;
          email?: string;
        } | null;
        return [
          profile.id_code,
          decryptSensitiveText(
            profile.identifier_ciphertext,
            `${context}:identifier`,
          ),
          donor?.name ?? "",
          decryptSensitiveText(
            profile.address_ciphertext,
            `${context}:address`,
          ),
          donor?.email ?? "",
          donation.captured_at,
          (donation.amount_paise / 100).toFixed(2),
          (donation.refunded_paise / 100).toFixed(2),
          ((donation.amount_paise - donation.refunded_paise) / 100).toFixed(2),
          donation.receipt_number,
          donation.status,
        ];
      }),
    ];
  } catch {
    return NextResponse.json(
      { error: "Encrypted donor tax details could not be read" },
      { status: 500 },
    );
  }
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="Form-10BD-preparation-${parsed.data.financialYear}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
