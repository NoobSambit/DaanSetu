import { getBrowserClient } from "@/lib/supabase";
import type {
  CorporateCampaign,
  CorporateCampaignCause,
  CorporateCampaignStatus,
} from "@/lib/types/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface CorporateCampaignWithProfile extends CorporateCampaign {
  corporate_profile: {
    id: string;
    company_name: string;
    industry: string;
    logo_url: string | null;
    website?: string | null;
  };
}

export async function getCorporateCampaigns(
  filters?: {
    cause?: CorporateCampaignCause;
    status?: CorporateCampaignStatus;
  },
  supabaseClient?: SupabaseClient,
): Promise<CorporateCampaignWithProfile[]> {
  const supabase = supabaseClient ?? getBrowserClient();
  let query = supabase.from("corporate_campaigns").select(`
    *,
    corporate_profile:corporate_profiles!corporate_campaigns_corporate_id_fkey(
      id,
      company_name,
      industry,
      logo_url
    )
  `);

  if (filters?.cause) query = query.eq("cause", filters.cause);
  query = query.eq("status", filters?.status ?? "active");

  const { data, error } = await query.order("created_at", {
    ascending: false,
  });
  if (error) throw new Error("CSR campaigns could not be loaded");
  return data as unknown as CorporateCampaignWithProfile[];
}

export async function getCorporateCampaign(
  campaignId: string,
  supabaseClient?: SupabaseClient,
): Promise<CorporateCampaignWithProfile | null> {
  const supabase = supabaseClient ?? getBrowserClient();
  const { data, error } = await supabase
    .from("corporate_campaigns")
    .select(
      `
      *,
      corporate_profile:corporate_profiles!corporate_campaigns_corporate_id_fkey(
        id,
        company_name,
        industry,
        logo_url,
        website
      )
    `,
    )
    .eq("id", campaignId)
    .maybeSingle();

  if (error) throw new Error("CSR campaign could not be loaded");
  return data as unknown as CorporateCampaignWithProfile | null;
}

export async function getCorporateCampaignsByCorporate(
  corporateId: string,
  supabaseClient?: SupabaseClient,
): Promise<CorporateCampaign[]> {
  const supabase = supabaseClient ?? getBrowserClient();
  const { data, error } = await supabase
    .from("corporate_campaigns")
    .select("*")
    .eq("corporate_id", corporateId)
    .order("created_at", { ascending: false });

  if (error) throw new Error("Corporate campaigns could not be loaded");
  return data;
}

export const CORPORATE_CAMPAIGN_CAUSES: CorporateCampaignCause[] = [
  "education",
  "food",
  "health",
  "disaster",
  "women",
  "animals",
  "environment",
];
