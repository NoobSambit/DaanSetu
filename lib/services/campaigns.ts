import { getBrowserClient } from "@/lib/supabase";
import type { CampaignUpdate } from "@/lib/types/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function getCampaignUpdates(
  campaignId: string,
  supabaseClient?: SupabaseClient,
): Promise<CampaignUpdate[]> {
  const supabase = supabaseClient ?? getBrowserClient();
  const { data, error } = await supabase
    .from("campaign_updates")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Campaign updates could not be loaded");
  }

  return data as CampaignUpdate[];
}
