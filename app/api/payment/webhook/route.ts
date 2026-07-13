import { NextRequest, NextResponse } from "next/server";

import { verifyPayPalWebhook } from "@/lib/payments/paypal";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type PayPalWebhook = {
  id?: string;
  event_type?: string;
  resource?: {
    id?: string;
    status?: string;
    amount?: { value?: string; currency_code?: string };
    supplementary_data?: { related_ids?: { order_id?: string } };
  };
};

export async function POST(request: NextRequest) {
  const event = (await request
    .json()
    .catch(() => null)) as PayPalWebhook | null;
  if (!event?.id)
    return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });

  const headers = {
    authAlgorithm: request.headers.get("paypal-auth-algo") ?? "",
    certUrl: request.headers.get("paypal-cert-url") ?? "",
    transmissionId: request.headers.get("paypal-transmission-id") ?? "",
    transmissionSignature: request.headers.get("paypal-transmission-sig") ?? "",
    transmissionTime: request.headers.get("paypal-transmission-time") ?? "",
  };
  if (!(await verifyPayPalWebhook(headers, event))) {
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { error: eventError } = await admin.from("payment_events").insert({
    gateway_event_id: event.id,
    event_type: event.event_type ?? "unknown",
    payload: event as unknown as Record<string, unknown>,
  });
  if (eventError?.code === "23505")
    return NextResponse.json({ received: true, duplicate: true });
  if (eventError)
    return NextResponse.json(
      { error: "Webhook could not be recorded" },
      { status: 500 },
    );

  if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
    const orderId = event.resource?.supplementary_data?.related_ids?.order_id;
    const paymentId = event.resource?.id;
    const { data: order } = await admin
      .from("payment_orders")
      .select("amount_paise, settlement_amount_minor")
      .eq("gateway_order_id", orderId ?? "")
      .maybeSingle();
    const receivedMinor = Math.round(
      Number(event.resource?.amount?.value ?? 0) * 100,
    );

    if (
      !order ||
      !orderId ||
      !paymentId ||
      receivedMinor !== order.settlement_amount_minor
    ) {
      return NextResponse.json(
        { error: "Webhook amount mismatch" },
        { status: 409 },
      );
    }

    const { error } = await admin.rpc("record_completed_payment", {
      order_identifier: orderId,
      payment_identifier: paymentId,
      credited_amount_paise: order.amount_paise,
      provider_payload: { provider: "paypal", eventId: event.id },
      demo_payment: false,
    });
    if (error)
      return NextResponse.json(
        { error: "Webhook reconciliation failed" },
        { status: 500 },
      );
  }

  await admin
    .from("payment_events")
    .update({ processed_at: new Date().toISOString() })
    .eq("gateway_event_id", event.id);
  return NextResponse.json({ received: true });
}
