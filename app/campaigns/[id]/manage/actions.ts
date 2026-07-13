"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { campaignStatuses } from "@/lib/domain/campaigns";
import { createClient } from "@/lib/supabase/server";

const transitionSchema = z.object({
  campaignId: z.string().uuid(),
  status: z.enum(campaignStatuses),
  note: z.string().trim().max(1000).optional(),
});

export async function transitionCampaignAction(input: unknown) {
  const values = transitionSchema.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email_confirmed_at) {
    throw new Error("A verified account is required");
  }

  const { error } = await supabase.rpc("transition_campaign", {
    campaign_uuid: values.campaignId,
    next_status: values.status,
    decision_note: values.note ?? null,
  });

  if (error) {
    throw new Error("The campaign status could not be changed");
  }

  revalidatePath(`/campaigns/${values.campaignId}`);
  revalidatePath(`/campaigns/${values.campaignId}/manage`);
}
