"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const payoutRecipientSchema = z.object({
  beneficiaryName: z.string().trim().min(2).max(120),
  recipientEmail: z.string().email().max(254),
});

export async function submitPayoutRecipientAction(formData: FormData) {
  const values = payoutRecipientSchema.parse({
    beneficiaryName: formData.get("beneficiaryName"),
    recipientEmail: formData.get("recipientEmail"),
  });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email_confirmed_at) {
    throw new Error("Verified authentication is required");
  }
  const { data: ngo } = await supabase
    .from("ngos")
    .select("id, is_verified")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!ngo?.is_verified) throw new Error("Verified NGO status is required");

  const { error } = await supabase.from("payout_accounts").insert({
    owner_id: user.id,
    ngo_id: ngo.id,
    provider: "paypal",
    status: "pending",
    beneficiary: {
      beneficiaryName: values.beneficiaryName,
      recipientEmail: values.recipientEmail.toLocaleLowerCase("en-US"),
    },
  });
  if (error) throw new Error("Payout recipient could not be submitted");
  revalidatePath("/ngo/dashboard/payouts");
}
