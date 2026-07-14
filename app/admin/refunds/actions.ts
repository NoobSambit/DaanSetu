"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { paiseToSettlementMinor } from "@/lib/domain/payment-money";
import { refundPayPalCapture } from "@/lib/payments/paypal";
import { createAdminClient } from "@/lib/supabase/admin";

const reviewSchema = z.object({
  refundRequestId: z.string().uuid(),
  decision: z.enum(["approve", "reject"]),
  note: z.string().trim().min(10).max(1000),
});

export async function reviewRefundAction(formData: FormData) {
  const values = reviewSchema.parse({
    refundRequestId: formData.get("refundRequestId"),
    decision: formData.get("decision"),
    note: formData.get("note"),
  });
  await requireAdmin("/admin/refunds");
  const admin = createAdminClient();
  const { data: request } = await admin
    .from("refund_requests")
    .select("id, donation_id, amount_paise, status, gateway_refund_id")
    .eq("id", values.refundRequestId)
    .maybeSingle();

  if (!request || request.status !== "submitted" || request.gateway_refund_id) {
    throw new Error("This refund request has already been reviewed");
  }

  if (values.decision === "reject") {
    const { error } = await admin.rpc("review_refund_request", {
      refund_request_uuid: request.id,
      decision: values.decision,
      decision_note: values.note,
    });
    if (error) throw new Error("Refund decision could not be recorded");
    revalidatePath("/admin/refunds");
    return;
  }

  if (process.env.ENABLE_PAYMENTS !== "true") {
    throw new Error("PayPal refunds are currently disabled");
  }
  const { data: donation } = await admin
    .from("donations")
    .select("gateway_order_id, gateway_payment_id, status, is_demo")
    .eq("id", request.donation_id)
    .maybeSingle();
  if (
    !donation?.gateway_order_id ||
    !donation.gateway_payment_id ||
    donation.is_demo ||
    !["captured", "partially_refunded"].includes(donation.status)
  ) {
    throw new Error("The captured donation cannot be refunded");
  }
  const { data: order } = await admin
    .from("payment_orders")
    .select("exchange_rate")
    .eq("gateway_order_id", donation.gateway_order_id)
    .maybeSingle();
  if (!order?.exchange_rate)
    throw new Error("Payment settlement data is missing");

  const { data: processing, error: claimError } = await admin.rpc(
    "review_refund_request",
    {
      refund_request_uuid: request.id,
      decision: values.decision,
      decision_note: values.note,
    },
  );
  if (claimError || !processing) {
    throw new Error("The refund request is already being processed");
  }

  try {
    const refund = await refundPayPalCapture({
      captureId: donation.gateway_payment_id,
      amountUsdCents: paiseToSettlementMinor(
        request.amount_paise,
        Number(order.exchange_rate),
      ),
      requestId: request.id,
    });
    if (refund.status === "COMPLETED") {
      const { error } = await admin.rpc("complete_paypal_refund", {
        refund_request_uuid: request.id,
        gateway_refund_identifier: refund.id,
        refunded_amount_paise: request.amount_paise,
      });
      if (error) throw new Error("Refund reconciliation failed");
    } else if (refund.status === "PENDING") {
      await admin
        .from("refund_requests")
        .update({ gateway_refund_id: refund.id })
        .eq("id", request.id);
    } else {
      throw new Error("PayPal did not accept the refund");
    }
  } catch {
    await admin
      .from("refund_requests")
      .update({ status: "failed" })
      .eq("id", request.id)
      .eq("status", "processing");
    throw new Error("PayPal refund execution failed");
  }

  revalidatePath("/admin/refunds");
  revalidatePath("/dashboard/giving");
}
