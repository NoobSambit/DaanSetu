import { NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        character
      ] ?? character,
  );
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: donation } = await admin
    .from("donations")
    .select(
      "id, user_id, amount_paise, status, captured_at, receipt_number, provider, is_demo, ngos(name)",
    )
    .eq("id", id)
    .maybeSingle();
  if (
    !donation ||
    donation.user_id !== user.id ||
    donation.status !== "captured"
  )
    return NextResponse.json({ error: "Receipt not found" }, { status: 404 });

  const ngo = donation.ngos as { name?: string } | null;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>DaanSetu receipt</title></head><body><h1>DaanSetu payment receipt</h1><p>Receipt: ${escapeHtml(donation.receipt_number ?? donation.id)}</p><p>Organization: ${escapeHtml(ngo?.name ?? "DaanSetu partner")}</p><p>Amount: INR ${(donation.amount_paise / 100).toFixed(2)}</p><p>Status: Captured via ${escapeHtml(donation.provider)}</p><p>${donation.is_demo ? "DEMONSTRATION ONLY — NO MONEY MOVED" : `Captured: ${escapeHtml(donation.captured_at ?? "")}`}</p><p>This transaction receipt is not Form 10BE.</p></body></html>`;
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="receipt-${donation.receipt_number ?? donation.id}.html"`,
      "Cache-Control": "private, no-store",
    },
  });
}
