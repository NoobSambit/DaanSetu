import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { financialYearRange } from "@/lib/domain/financial-year";
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
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      "receipt_number, amount_paise, captured_at, status, is_demo, ngos(name)",
    )
    .eq("user_id", user.id)
    .in("status", ["captured", "partially_refunded", "refunded"])
    .eq("is_demo", false)
    .gte("captured_at", range.startsAt)
    .lt("captured_at", range.endsBefore)
    .order("captured_at", { ascending: true });
  if (error) {
    return NextResponse.json(
      { error: "Summary could not be generated" },
      { status: 500 },
    );
  }

  const rows = [
    ["Receipt", "Captured date", "Organization", "Amount INR", "Status"],
    ...(donations ?? []).map((donation) => [
      donation.receipt_number,
      donation.captured_at,
      (donation.ngos as { name?: string } | null)?.name ?? "",
      (donation.amount_paise / 100).toFixed(2),
      donation.status,
    ]),
  ];
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="DaanSetu-${parsed.data.financialYear}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
