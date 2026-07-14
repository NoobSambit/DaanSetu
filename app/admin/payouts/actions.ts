"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { paiseToSettlementMinor } from "@/lib/domain/payment-money";
import { createPayPalPayout } from "@/lib/payments/paypal";
import { createAdminClient } from "@/lib/supabase/admin";

const decisionSchema = z.object({
  payoutAccountId: z.string().uuid(),
  status: z.enum(["active", "rejected", "restricted"]),
  note: z.string().trim().min(10).max(1000),
});

const executeSchema = z.object({
  donationId: z.string().uuid(),
});

export async function reviewPayoutAccountAction(formData: FormData) {
  const values = decisionSchema.parse({
    payoutAccountId: formData.get("payoutAccountId"),
    status: formData.get("status"),
    note: formData.get("note"),
  });
  await requireAdmin("/admin/payouts");
  const admin = createAdminClient();
  const { data: account, error } = await admin.rpc("review_payout_account", {
    payout_account_uuid: values.payoutAccountId,
    next_status: values.status,
    decision_note: values.note,
  });
  if (error || !account) {
    throw new Error("Payout account decision could not be recorded");
  }
  revalidatePath("/admin/payouts");
  revalidatePath("/ngo/dashboard/payouts");
}

export async function executePayoutAction(formData: FormData) {
  const values = executeSchema.parse({
    donationId: formData.get("donationId"),
  });
  const reviewer = await requireAdmin("/admin/payouts");
  if (process.env.PAYPAL_PAYOUTS_ENABLED !== "true") {
    throw new Error("PayPal payouts are currently disabled");
  }

  const inrPerUsd = Number(process.env.PAYPAL_INR_PER_USD);
  if (!Number.isFinite(inrPerUsd) || inrPerUsd <= 0) {
    throw new Error("PayPal conversion rate is unavailable");
  }

  const admin = createAdminClient();
  const { data: donation } = await admin
    .from("donations")
    .select("id, amount_paise, status, is_demo")
    .eq("id", values.donationId)
    .eq("is_demo", false)
    .eq("status", "captured")
    .maybeSingle();
  if (!donation) {
    throw new Error("The donation is not eligible for payout");
  }

  const settlementAmountMinor = paiseToSettlementMinor(
    donation.amount_paise,
    inrPerUsd,
  );
  const { data: claimed, error: claimError } = await admin.rpc(
    "claim_paypal_payout_transfer",
    {
      donation_uuid: donation.id,
      settlement_minor: settlementAmountMinor,
    },
  );
  if (claimError || !claimed) {
    throw new Error("This donation has already been claimed for payout");
  }

  const transfer = claimed as {
    id: string;
    payout_account_id: string;
    sender_batch_id: string;
    sender_item_id: string;
  };
  const { data: payoutAccount } = await admin
    .from("payout_accounts")
    .select("beneficiary, status")
    .eq("id", transfer.payout_account_id)
    .eq("status", "active")
    .maybeSingle();
  const beneficiary = payoutAccount?.beneficiary as {
    recipientEmail?: string;
    email?: string;
  } | null;
  const recipientEmail = beneficiary?.recipientEmail ?? beneficiary?.email;
  if (!recipientEmail) {
    await admin.rpc("reconcile_paypal_payout_transfer", {
      sender_batch_identifier: transfer.sender_batch_id,
      sender_item_identifier: transfer.sender_item_id,
      provider_batch_identifier: null,
      provider_item_identifier: null,
      next_status: "failed",
      failure_detail: "Approved recipient email is missing",
    });
    throw new Error("The approved payout recipient is incomplete");
  }

  try {
    const payout = await createPayPalPayout({
      senderBatchId: transfer.sender_batch_id,
      senderItemId: transfer.sender_item_id,
      recipientEmail,
      amountUsdCents: settlementAmountMinor,
    });
    const providerBatchId = payout.batch_header?.payout_batch_id;
    if (!providerBatchId) {
      throw new Error("PayPal returned no payout batch identifier");
    }
    const { error } = await admin.rpc("reconcile_paypal_payout_transfer", {
      sender_batch_identifier: transfer.sender_batch_id,
      sender_item_identifier: transfer.sender_item_id,
      provider_batch_identifier: providerBatchId,
      provider_item_identifier: null,
      next_status: "created",
      failure_detail: null,
    });
    if (error) {
      throw new Error("Payout reconciliation failed");
    }
  } catch {
    await admin.rpc("reconcile_paypal_payout_transfer", {
      sender_batch_identifier: transfer.sender_batch_id,
      sender_item_identifier: transfer.sender_item_id,
      provider_batch_identifier: null,
      provider_item_identifier: null,
      next_status: "failed",
      failure_detail: "PayPal payout execution failed",
    });
    throw new Error("PayPal payout execution failed");
  }

  await admin.from("audit_logs").insert({
    user_id: reviewer.id,
    action: "payout.executed",
    entity_type: "payment_transfer",
    entity_id: transfer.id,
    changes: { donationId: donation.id },
  });
  revalidatePath("/admin/payouts");
  revalidatePath("/ngo/dashboard/payouts");
}
