"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const decisionSchema = z.object({
  campaignId: z.string().uuid(),
  decision: z.enum(["changes_requested", "rejected", "approved", "active"]),
  note: z.string().trim().min(10).max(1000),
});

export async function reviewFundraiserAction(input: unknown) {
  const values = decisionSchema.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Authentication required");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("Admin access required");

  const { error } = await supabase.rpc("transition_campaign", {
    campaign_uuid: values.campaignId,
    next_status: values.decision,
    decision_note: values.note,
  });

  if (error) throw new Error("The fundraiser decision could not be saved");
  revalidatePath("/admin/fundraisers");
}

export async function reviewFundraiserFormAction(formData: FormData) {
  return reviewFundraiserAction({
    campaignId: formData.get("campaignId"),
    decision: formData.get("decision"),
    note: formData.get("note"),
  });
}
