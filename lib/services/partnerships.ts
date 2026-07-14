import { getBrowserClient } from "@/lib/supabase";
import type { PartnershipRequest } from "@/lib/types/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface PartnershipRequestWithDetails extends PartnershipRequest {
  corporate_campaign: {
    id: string;
    title: string;
    cause: string;
    goal_paise: number;
  };
  ngo: {
    id: string;
    name: string;
    category: string;
    city?: string;
    state?: string;
  };
}

export async function getPartnershipRequestsForNGO(
  ngoId: string,
  supabaseClient?: SupabaseClient,
): Promise<PartnershipRequestWithDetails[]> {
  const supabase = supabaseClient ?? getBrowserClient();
  const { data, error } = await supabase
    .from("partnership_requests")
    .select(
      `
      *,
      corporate_campaign:corporate_campaigns!partnership_requests_corporate_campaign_id_fkey(
        id,
        title,
        cause,
        goal_paise
      ),
      ngo:ngos!partnership_requests_ngo_id_fkey(
        id,
        name,
        category
      )
    `,
    )
    .eq("ngo_id", ngoId)
    .order("created_at", { ascending: false });

  if (error) throw new Error("Partnership requests could not be loaded");
  return data as unknown as PartnershipRequestWithDetails[];
}

export async function getPartnershipRequestsForCampaign(
  campaignId: string,
  supabaseClient?: SupabaseClient,
): Promise<PartnershipRequestWithDetails[]> {
  const supabase = supabaseClient ?? getBrowserClient();
  const { data, error } = await supabase
    .from("partnership_requests")
    .select(
      `
      *,
      corporate_campaign:corporate_campaigns!partnership_requests_corporate_campaign_id_fkey(
        id,
        title,
        cause,
        goal_paise
      ),
      ngo:ngos!partnership_requests_ngo_id_fkey(
        id,
        name,
        category,
        city,
        state
      )
    `,
    )
    .eq("corporate_campaign_id", campaignId)
    .order("created_at", { ascending: false });

  if (error) throw new Error("Partnership requests could not be loaded");
  return data as unknown as PartnershipRequestWithDetails[];
}

export async function hasAppliedForPartnership(
  corporateCampaignId: string,
  ngoId: string,
  supabaseClient?: SupabaseClient,
): Promise<boolean> {
  const supabase = supabaseClient ?? getBrowserClient();
  const { data, error } = await supabase
    .from("partnership_requests")
    .select("id")
    .eq("corporate_campaign_id", corporateCampaignId)
    .eq("ngo_id", ngoId)
    .maybeSingle();

  if (error) throw new Error("Partnership status could not be loaded");
  return Boolean(data);
}
