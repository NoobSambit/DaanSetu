import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { paiseToSettlementMinor } from "@/lib/domain/payment-money";
import { rateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { createPayPalOrder } from "@/lib/payments/paypal";
import { hasValidRequestOrigin } from "@/lib/security/origin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const orderSchema = z.object({
  campaignId: z.string().uuid(),
  amountPaise: z.number().int().min(100).max(100_000_000),
  cause: z.enum(["education", "hunger", "healthcare", "disaster", "general"]),
  isAnonymous: z.boolean(),
  csrInitiativeId: z.string().uuid().nullable().optional(),
});

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
  let employeeId: string | null = null;
  if (parsed.data.csrInitiativeId) {
    const [{ data: employee }, { data: initiative }] = await Promise.all([
      admin
        .from("corporate_employees")
        .select("id, corporate_id")
        .eq("user_id", user.id)
        .maybeSingle(),
      admin
        .from("csr_initiatives")
        .select("id, corporate_id, campaign_id, status, starts_at, ends_at")
        .eq("id", parsed.data.csrInitiativeId)
        .maybeSingle(),
    ]);
    const now = Date.now();
    if (
      !employee ||
      !initiative ||
      employee.corporate_id !== initiative.corporate_id ||
      initiative.status !== "active" ||
      (initiative.campaign_id !== null &&
        initiative.campaign_id !== campaign.id) ||
      new Date(initiative.starts_at).getTime() > now ||
      new Date(initiative.ends_at).getTime() < now
    ) {
      return NextResponse.json(
        { error: "This employee match is not eligible for the donation" },
        { status: 409 },
      );
    }
    employeeId = employee.id;
  }
  const internalOrderId = crypto.randomUUID();
  const amountUsdCents = paiseToSettlementMinor(
    parsed.data.amountPaise,
    inrPerUsd,
  );
  const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    return NextResponse.json(
      { error: "Application URL is unavailable" },
      { status: 503 },
    );
  }
  const paypalOrder = await createPayPalOrder({
    internalOrderId,
    campaignId: campaign.id,
    amountUsdCents,
    returnUrl: `${appUrl}/donation/paypal-return`,
    cancelUrl: `${appUrl}/dashboard/giving?payment=cancelled`,
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
    cause: parsed.data.cause,
    is_anonymous: parsed.data.isAnonymous,
    csr_initiative_id: parsed.data.csrInitiativeId ?? null,
    corporate_employee_id: employeeId,
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
