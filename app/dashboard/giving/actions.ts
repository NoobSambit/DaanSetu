"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const refundSchema = z.object({
  donationId: z.string().uuid(),
  amountPaise: z.number().int().positive(),
  reason: z.string().trim().min(20).max(1000),
});

export async function requestRefundAction(formData: FormData) {
  const values = refundSchema.parse({
    donationId: formData.get("donationId"),
    amountPaise: Number(formData.get("amountPaise")),
    reason: formData.get("reason"),
  });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required");

  const { data: donation } = await supabase
    .from("donations")
    .select("id, user_id, amount_paise, refunded_paise, status, is_demo")
    .eq("id", values.donationId)
    .maybeSingle();
  if (
    !donation ||
    donation.user_id !== user.id ||
    donation.status !== "captured" ||
    donation.is_demo
  ) {
    throw new Error("This donation is not eligible for a refund request");
  }
  if (values.amountPaise > donation.amount_paise - donation.refunded_paise) {
    throw new Error("Refund amount exceeds the remaining captured amount");
  }

  const { error } = await supabase.from("refund_requests").insert({
    donation_id: donation.id,
    requester_id: user.id,
    amount_paise: values.amountPaise,
    reason: values.reason,
  });
  if (error) throw new Error("Refund request could not be submitted");
  revalidatePath("/dashboard/giving");
}
