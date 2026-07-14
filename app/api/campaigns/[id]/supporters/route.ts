import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const campaignId = z
    .string()
    .uuid()
    .safeParse((await context.params).id);
  if (!campaignId.success) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const admin = createAdminClient();
  const { data: campaign } = await admin
    .from("campaigns")
    .select("id")
    .eq("id", campaignId.data)
    .in("status", ["active", "completed"])
    .not("published_at", "is", null)
    .maybeSingle();
  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const { data, error } = await admin
    .from("donations")
    .select(
      "id, amount_paise, refunded_paise, is_anonymous, captured_at, users(name)",
    )
    .eq("campaign_id", campaign.id)
    .eq("is_demo", false)
    .in("status", ["captured", "partially_refunded"])
    .order("captured_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json(
      { error: "Supporters could not be loaded" },
      { status: 503 },
    );
  }

  const donors = (data ?? []).flatMap((donation) => {
    const amountPaise = Math.max(
      0,
      donation.amount_paise - donation.refunded_paise,
    );
    if (amountPaise === 0 || !donation.captured_at) return [];
    const profile = Array.isArray(donation.users)
      ? donation.users[0]
      : donation.users;
    return [
      {
        id: donation.id,
        amountPaise,
        is_anonymous: donation.is_anonymous,
        capturedAt: donation.captured_at,
        name: donation.is_anonymous
          ? "Anonymous"
          : profile?.name || "Supporter",
      },
    ];
  });

  return NextResponse.json(
    { donors },
    {
      headers: {
        "Cache-Control": "public, max-age=30, stale-while-revalidate=60",
      },
    },
  );
}
