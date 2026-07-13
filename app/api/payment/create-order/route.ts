import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { rateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { createPayPalOrder } from "@/lib/payments/paypal";
import { hasValidRequestOrigin } from "@/lib/security/origin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const orderSchema = z.object({
  campaignId: z.string().uuid(),
  amountPaise: z.number().int().min(100).max(100_000_000),
});

function convertPaiseToUsdCents(
  amountPaise: number,
  inrPerUsd: number,
): number {
  return Math.max(1, Math.round(amountPaise / inrPerUsd));
}

async function handler(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) {
    return NextResponse.json(
      { error: "Invalid request origin" },
      { status: 403 },
    );
  }

  const parsed = orderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid order request" },
      { status: 400 },
    );
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email_confirmed_at) {
    return NextResponse.json(
      { error: "Verified authentication required" },
      { status: 401 },
    );
  }

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, status, deadline, payout_account_id, payout_accounts(status)")
    .eq("id", parsed.data.campaignId)
    .maybeSingle();
  const payout = campaign?.payout_accounts as unknown as {
    status: string;
  } | null;
  if (
    !campaign ||
    campaign.status !== "active" ||
    payout?.status !== "active" ||
    new Date(campaign.deadline).getTime() <= Date.now()
  ) {
    return NextResponse.json(
      { error: "This campaign cannot accept donations" },
      { status: 409 },
    );
  }

  const inrPerUsd = Number(process.env.PAYPAL_INR_PER_USD);
  if (!Number.isFinite(inrPerUsd) || inrPerUsd <= 0) {
    return NextResponse.json(
      { error: "PayPal conversion rate is unavailable" },
      { status: 503 },
    );
  }

  const admin = createAdminClient();
  const internalOrderId = crypto.randomUUID();
  const amountUsdCents = convertPaiseToUsdCents(
    parsed.data.amountPaise,
    inrPerUsd,
  );
  const paypalOrder = await createPayPalOrder({
    internalOrderId,
    campaignId: campaign.id,
    amountUsdCents,
  });
  const { error } = await admin.from("payment_orders").insert({
    id: internalOrderId,
    donor_id: user.id,
    campaign_id: campaign.id,
    amount_paise: parsed.data.amountPaise,
    gateway_order_id: paypalOrder.id,
    status: "created",
    expires_at: new Date(Date.now() + 3 * 60 * 60_000).toISOString(),
    provider: "paypal",
    settlement_currency: "USD",
    settlement_amount_minor: amountUsdCents,
    exchange_rate: inrPerUsd,
  });
  if (error)
    return NextResponse.json(
      { error: "Order could not be recorded" },
      { status: 500 },
    );

  return NextResponse.json({
    orderId: paypalOrder.id,
    amountPaise: parsed.data.amountPaise,
    settlementCurrency: "USD",
    settlementAmount: (amountUsdCents / 100).toFixed(2),
    approvalUrl:
      paypalOrder.links?.find((link) => link.rel === "approve")?.href ?? null,
  });
}

export const POST = rateLimit(RATE_LIMITS.PAYMENT)(handler);
