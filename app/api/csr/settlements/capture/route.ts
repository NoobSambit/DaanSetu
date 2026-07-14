import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { rateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { capturePayPalOrder } from "@/lib/payments/paypal";
import { hasValidRequestOrigin } from "@/lib/security/origin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";

const schema = z.object({
  orderId: z.string().min(3).max(200),
  action: z.enum(["capture", "cancel"]).default("capture"),
});

async function handler(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) {
    return NextResponse.json(
      { error: "Invalid request origin" },
      { status: 403 },
    );
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid settlement capture" },
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

  const { data: corporate } = await supabase
    .from("corporate_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!corporate) {
    return NextResponse.json(
      { error: "Corporate access required" },
      { status: 403 },
    );
  }

  const admin = createAdminClient();
  const { data: settlement } = await admin
    .from("csr_settlements")
    .select("id, corporate_id, status, provider_amount_cents")
    .eq("gateway_order_id", parsed.data.orderId)
    .maybeSingle();
  if (!settlement || settlement.corporate_id !== corporate.id) {
    return NextResponse.json(
      { error: "Settlement not found" },
      { status: 404 },
    );
  }
  if (parsed.data.action === "cancel") {
    if (settlement.status === "captured") {
      return NextResponse.json(
        { error: "A captured settlement cannot be cancelled" },
        { status: 409 },
      );
    }
    const { error } = await admin.rpc("cancel_csr_settlement", {
      provider_order_id: parsed.data.orderId,
    });
    if (error) {
      return NextResponse.json(
        { error: "The settlement cancellation could not be recorded" },
        { status: 409 },
      );
    }
    return NextResponse.json({ success: true, cancelled: true });
  }

  if (settlement.status === "captured") {
    return NextResponse.json({ success: true });
  }

  try {
    const paypalOrder = await capturePayPalOrder(parsed.data.orderId);
    const capture = paypalOrder.purchase_units?.[0]?.payments?.captures?.[0];
    const capturedCents = capture?.amount
      ? Math.round(Number(capture.amount.value) * 100)
      : Number.NaN;
    if (
      paypalOrder.status !== "COMPLETED" ||
      capture?.status !== "COMPLETED" ||
      capture.amount.currency_code !== "USD" ||
      !Number.isSafeInteger(capturedCents) ||
      capturedCents !== settlement.provider_amount_cents
    ) {
      return NextResponse.json(
        { success: false, status: paypalOrder.status },
        { status: 202 },
      );
    }

    const { error } = await admin.rpc("capture_csr_settlement", {
      provider_order_id: parsed.data.orderId,
      provider_payment_id: capture.id,
      captured_amount_cents: capturedCents,
      provider_payload: paypalOrder,
    });
    if (error) {
      return NextResponse.json(
        { error: "CSR settlement reconciliation failed" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "PayPal settlement capture failed" },
      { status: 502 },
    );
  }
}

export const POST = rateLimit(RATE_LIMITS.PAYMENT)(handler);
