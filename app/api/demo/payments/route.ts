import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { rateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { hasValidRequestOrigin } from "@/lib/security/origin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";

const schema = z.object({
  campaignId: z.string().uuid(),
  amountPaise: z.number().int().min(100).max(1_000_000),
});

async function handler(request: NextRequest) {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.ENABLE_DEMO_PAYMENTS !== "true"
  ) {
    return NextResponse.json(
      { error: "Demo payments are disabled" },
      { status: 404 },
    );
  }
  if (!hasValidRequestOrigin(request))
    return NextResponse.json(
      { error: "Invalid request origin" },
      { status: 403 },
    );

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Invalid demo payment" },
      { status: 400 },
    );

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email_confirmed_at)
    return NextResponse.json(
      { error: "Verified authentication required" },
      { status: 401 },
    );

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, status")
    .eq("id", parsed.data.campaignId)
    .maybeSingle();
  if (!campaign || campaign.status !== "active")
    return NextResponse.json(
      { error: "Choose an active campaign" },
      { status: 409 },
    );

  const admin = createAdminClient();
  const internalId = crypto.randomUUID();
  const orderId = `DEMO-ORDER-${crypto.randomUUID()}`;
  const paymentId = `DEMO-CAPTURE-${crypto.randomUUID()}`;
  const { error: orderError } = await admin.from("payment_orders").insert({
    id: internalId,
    donor_id: user.id,
    campaign_id: campaign.id,
    amount_paise: parsed.data.amountPaise,
    gateway_order_id: orderId,
    status: "created",
    expires_at: new Date(Date.now() + 30 * 60_000).toISOString(),
    provider: "demo",
    settlement_currency: "INR",
    settlement_amount_minor: parsed.data.amountPaise,
    exchange_rate: 1,
    is_demo: true,
  });
  if (orderError)
    return NextResponse.json({ error: "Demo order failed" }, { status: 500 });

  const { data: donationId, error } = await admin.rpc(
    "record_completed_payment",
    {
      order_identifier: orderId,
      payment_identifier: paymentId,
      credited_amount_paise: parsed.data.amountPaise,
      provider_payload: { provider: "demo", isDemo: true },
      demo_payment: true,
    },
  );
  if (error)
    return NextResponse.json({ error: "Demo capture failed" }, { status: 500 });

  return NextResponse.json({
    success: true,
    isDemo: true,
    donationId,
    message: "Demo completed. No money moved and public totals were unchanged.",
  });
}

export const POST = rateLimit(RATE_LIMITS.PAYMENT)(handler);
