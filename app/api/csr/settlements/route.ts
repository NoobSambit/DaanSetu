import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { rateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { createPayPalOrder } from "@/lib/payments/paypal";
import { hasValidRequestOrigin } from "@/lib/security/origin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";

const schema = z.object({
  pledgeIds: z.array(z.string().uuid()).min(1).max(500),
});

async function handler(request: NextRequest) {
  if (!hasValidRequestOrigin(request))
    return NextResponse.json(
      { error: "Invalid request origin" },
      { status: 403 },
    );
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Invalid pledge batch" },
      { status: 400 },
    );

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: corporate } = await supabase
    .from("corporate_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!corporate)
    return NextResponse.json(
      { error: "Corporate access required" },
      { status: 403 },
    );

  const admin = createAdminClient();
  const { data: pledges } = await admin
    .from("csr_match_pledges")
    .select("id, matched_paise, status, csr_initiatives(corporate_id)")
    .in("id", parsed.data.pledgeIds);
  const owned = (pledges ?? []).filter(
    (pledge) =>
      pledge.status === "outstanding" &&
      (pledge.csr_initiatives as { corporate_id?: string } | null)
        ?.corporate_id === corporate.id,
  );
  if (owned.length !== parsed.data.pledgeIds.length)
    return NextResponse.json(
      { error: "One or more pledges are unavailable" },
      { status: 409 },
    );

  const amountPaise = owned.reduce(
    (sum, pledge) => sum + pledge.matched_paise,
    0,
  );
  const inrPerUsd = Number(process.env.PAYPAL_INR_PER_USD);
  if (!Number.isFinite(inrPerUsd) || inrPerUsd <= 0)
    return NextResponse.json(
      { error: "PayPal conversion rate unavailable" },
      { status: 503 },
    );
  const settlementId = crypto.randomUUID();
  const paypal = await createPayPalOrder({
    internalOrderId: settlementId,
    campaignId: `csr:${corporate.id}`,
    amountUsdCents: Math.max(1, Math.round(amountPaise / inrPerUsd)),
  });

  const { error } = await admin.rpc("create_csr_settlement_batch", {
    settlement_uuid: settlementId,
    corporate_uuid: corporate.id,
    pledge_uuids: owned.map((pledge) => pledge.id),
    total_amount_paise: amountPaise,
    provider_order_id: paypal.id,
  });
  if (error)
    return NextResponse.json(
      { error: "CSR settlement could not be recorded" },
      { status: 500 },
    );
  return NextResponse.json({
    settlementId,
    approvalUrl:
      paypal.links?.find((link) => link.rel === "approve")?.href ?? null,
  });
}

export const POST = rateLimit(RATE_LIMITS.PAYMENT)(handler);
