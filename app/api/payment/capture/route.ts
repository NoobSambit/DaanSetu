import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { rateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { capturePayPalOrder } from "@/lib/payments/paypal";
import { hasValidRequestOrigin } from "@/lib/security/origin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";

const schema = z.object({ orderId: z.string().min(5).max(100) });

async function handler(request: NextRequest) {
  if (!hasValidRequestOrigin(request))
    return NextResponse.json(
      { error: "Invalid request origin" },
      { status: 403 },
    );
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Invalid capture request" },
      { status: 400 },
    );

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("payment_orders")
    .select("donor_id, amount_paise, settlement_amount_minor")
    .eq("gateway_order_id", parsed.data.orderId)
    .maybeSingle();
  if (!order || order.donor_id !== user.id)
    return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const capture = await capturePayPalOrder(parsed.data.orderId);
  const payment = capture.purchase_units?.[0]?.payments?.captures?.[0];
  if (
    capture.status !== "COMPLETED" ||
    payment?.status !== "COMPLETED" ||
    Math.round(Number(payment.amount.value) * 100) !==
      order.settlement_amount_minor
  ) {
    return NextResponse.json(
      { success: false, status: capture.status },
      { status: 202 },
    );
  }

  const { data: donationId, error } = await admin.rpc(
    "record_completed_payment",
    {
      order_identifier: parsed.data.orderId,
      payment_identifier: payment.id,
      credited_amount_paise: order.amount_paise,
      provider_payload: { provider: "paypal", status: payment.status },
      demo_payment: false,
    },
  );
  if (error)
    return NextResponse.json(
      { error: "Capture reconciliation failed" },
      { status: 500 },
    );
  return NextResponse.json({ success: true, donationId });
}

export const POST = rateLimit(RATE_LIMITS.PAYMENT)(handler);
