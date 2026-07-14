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
    billing_agreement_id?: string;
    payout_batch_id?: string;
    payout_item_id?: string;
    sender_item_id?: string;
    transaction_status?: string;
    batch_header?: {
      payout_batch_id?: string;
      batch_status?: string;
      sender_batch_header?: { sender_batch_id?: string };
    };
    supplementary_data?: {
      related_ids?: { order_id?: string; capture_id?: string };
    };
  };
};

const subscriptionStatuses: Record<string, string> = {
  "BILLING.SUBSCRIPTION.ACTIVATED": "active",
  "BILLING.SUBSCRIPTION.SUSPENDED": "paused",
  "BILLING.SUBSCRIPTION.CANCELLED": "cancelled",
  "BILLING.SUBSCRIPTION.EXPIRED": "expired",
  "BILLING.SUBSCRIPTION.PAYMENT.FAILED": "halted",
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
  if (eventError?.code === "23505") {
    const { data: existingEvent } = await admin
      .from("payment_events")
      .select("processed_at")
      .eq("gateway_event_id", event.id)
      .maybeSingle();
    if (existingEvent?.processed_at) {
      return NextResponse.json({ received: true, duplicate: true });
    }
  }
  if (eventError && eventError.code !== "23505")
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

  if (event.event_type === "PAYMENT.CAPTURE.REFUNDED" && event.resource?.id) {
    const { data: refund } = await admin
      .from("refund_requests")
      .select("id, amount_paise")
      .eq("gateway_refund_id", event.resource.id)
      .maybeSingle();
    if (refund) {
      const { error } = await admin.rpc("complete_paypal_refund", {
        refund_request_uuid: refund.id,
        gateway_refund_identifier: event.resource.id,
        refunded_amount_paise: refund.amount_paise,
      });
      if (error) {
        return NextResponse.json(
          { error: "Refund reconciliation failed" },
          { status: 500 },
        );
      }
    } else {
      const captureId =
        event.resource.supplementary_data?.related_ids?.capture_id;
      const { data: settlement } = await admin
        .from("csr_settlements")
        .select("provider_amount_cents")
        .eq("gateway_payment_id", captureId ?? "")
        .maybeSingle();
      const refundedCents = Math.round(
        Number(event.resource.amount?.value ?? 0) * 100,
      );
      if (
        !captureId ||
        !settlement ||
        event.resource.amount?.currency_code !== "USD" ||
        refundedCents !== settlement.provider_amount_cents
      ) {
        return NextResponse.json(
          { error: "Refund target or amount mismatch" },
          { status: 409 },
        );
      }
      const { error } = await admin.rpc("reverse_csr_settlement", {
        provider_capture_id: captureId,
        next_status: "refunded",
        provider_event_id: event.id,
      });
      if (error) {
        return NextResponse.json(
          { error: "CSR refund reconciliation failed" },
          { status: 500 },
        );
      }
    }
  }

  if (event.event_type === "PAYMENT.CAPTURE.REVERSED" && event.resource?.id) {
    const { data: donation } = await admin
      .from("donations")
      .select("id")
      .eq("gateway_payment_id", event.resource.id)
      .maybeSingle();
    if (donation) {
      const { error } = await admin.rpc("reverse_paypal_capture", {
        capture_identifier: event.resource.id,
      });
      if (error) {
        return NextResponse.json(
          { error: "Payment reversal reconciliation failed" },
          { status: 500 },
        );
      }
    } else {
      const { data: settlement } = await admin
        .from("csr_settlements")
        .select("id")
        .eq("gateway_payment_id", event.resource.id)
        .maybeSingle();
      if (!settlement) {
        return NextResponse.json(
          { error: "Reversed capture was not found" },
          { status: 409 },
        );
      }
      const { error } = await admin.rpc("reverse_csr_settlement", {
        provider_capture_id: event.resource.id,
        next_status: "reversed",
        provider_event_id: event.id,
      });
      if (error) {
        return NextResponse.json(
          { error: "CSR reversal reconciliation failed" },
          { status: 500 },
        );
      }
    }
  }

  const subscriptionStatus = event.event_type
    ? subscriptionStatuses[event.event_type]
    : undefined;
  if (subscriptionStatus && event.resource?.id) {
    const { error } = await admin.rpc("reconcile_paypal_subscription", {
      subscription_identifier: event.resource.id,
      next_status: subscriptionStatus,
    });
    if (error) {
      return NextResponse.json(
        { error: "Subscription reconciliation failed" },
        { status: 500 },
      );
    }
  }

  if (
    event.event_type === "PAYMENT.SALE.COMPLETED" &&
    event.resource?.id &&
    event.resource.billing_agreement_id
  ) {
    const { data: subscription } = await admin
      .from("subscriptions")
      .select("id, amount_paise, settlement_amount_minor")
      .eq("gateway_subscription_id", event.resource.billing_agreement_id)
      .maybeSingle();
    const receivedMinor = Math.round(
      Number(event.resource.amount?.value ?? 0) * 100,
    );
    if (
      !subscription?.settlement_amount_minor ||
      event.resource.amount?.currency_code !== "USD" ||
      receivedMinor !== subscription.settlement_amount_minor
    ) {
      return NextResponse.json(
        { error: "Subscription payment amount mismatch" },
        { status: 409 },
      );
    }
    const { error } = await admin.rpc("record_completed_subscription_payment", {
      subscription_identifier: event.resource.billing_agreement_id,
      payment_identifier: event.resource.id,
      received_settlement_minor: receivedMinor,
      provider_payload: { provider: "paypal", eventId: event.id },
    });
    if (error) {
      return NextResponse.json(
        { error: "Subscription payment reconciliation failed" },
        { status: 500 },
      );
    }
  }

  const payoutBatchStatuses: Record<string, string> = {
    "PAYMENT.PAYOUTSBATCH.PROCESSING": "processing",
    "PAYMENT.PAYOUTSBATCH.SUCCESS": "settled",
    "PAYMENT.PAYOUTSBATCH.DENIED": "failed",
  };
  const payoutItemStatuses: Record<string, string> = {
    "PAYMENT.PAYOUTS-ITEM.SUCCEEDED": "settled",
    "PAYMENT.PAYOUTS-ITEM.FAILED": "failed",
    "PAYMENT.PAYOUTS-ITEM.BLOCKED": "failed",
    "PAYMENT.PAYOUTS-ITEM.CANCELED": "failed",
    "PAYMENT.PAYOUTS-ITEM.HELD": "held",
    "PAYMENT.PAYOUTS-ITEM.UNCLAIMED": "unclaimed",
    "PAYMENT.PAYOUTS-ITEM.REFUNDED": "reversed",
    "PAYMENT.PAYOUTS-ITEM.RETURNED": "reversed",
  };
  const payoutStatus = event.event_type
    ? (payoutBatchStatuses[event.event_type] ??
      payoutItemStatuses[event.event_type])
    : undefined;
  if (payoutStatus) {
    const { error } = await admin.rpc("reconcile_paypal_payout_transfer", {
      sender_batch_identifier:
        event.resource?.batch_header?.sender_batch_header?.sender_batch_id ??
        null,
      sender_item_identifier: event.resource?.sender_item_id ?? null,
      provider_batch_identifier:
        event.resource?.batch_header?.payout_batch_id ??
        event.resource?.payout_batch_id ??
        null,
      provider_item_identifier:
        event.resource?.payout_item_id ?? event.resource?.id ?? null,
      next_status: payoutStatus,
      failure_detail:
        payoutStatus === "failed" ? "PayPal reported a failed payout" : null,
    });
    if (error) {
      return NextResponse.json(
        { error: "Payout reconciliation failed" },
        { status: 500 },
      );
    }
  }

  await admin
    .from("payment_events")
    .update({ processed_at: new Date().toISOString() })
    .eq("gateway_event_id", event.id);
  return NextResponse.json({ received: true });
}
