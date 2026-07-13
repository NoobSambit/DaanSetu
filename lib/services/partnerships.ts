import { getBrowserClient } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  PartnershipRequest,
  PartnershipRequestStatus,
} from "@/lib/types/database.types";

export interface CreatePartnershipRequestParams {
  corporateCampaignId: string;
  ngoId: string;
  message?: string;
}

export interface PartnershipRequestWithDetails extends PartnershipRequest {
  corporate_campaign: {
    id: string;
    title: string;
    cause: string;
    goal_amount: number;
  };
  ngo: {
    id: string;
    name: string;
    category: string;
  };
}

export async function createPartnershipRequest(
  params: CreatePartnershipRequestParams,
  supabaseClient?: SupabaseClient,
) {
  const supabase = supabaseClient || getBrowserClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be logged in to create a partnership request");
  }

  const { data, error } = await supabase
    .from("partnership_requests")
    .insert({
      corporate_campaign_id: params.corporateCampaignId,
      ngo_id: params.ngoId,
      message: params.message || null,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getPartnershipRequestsForNGO(
  ngoId: string,
  supabaseClient?: SupabaseClient,
): Promise<PartnershipRequestWithDetails[]> {
  const supabase = supabaseClient || getBrowserClient();

  const { data, error } = await supabase
    .from("partnership_requests")
    .select(
      `
      *,
      corporate_campaign:corporate_campaigns!partnership_requests_corporate_campaign_id_fkey(
        id,
        title,
        cause,
        goal_amount
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

  if (error) {
    throw error;
  }

  return data as unknown as PartnershipRequestWithDetails[];
}

export async function getPartnershipRequestsForCampaign(
  campaignId: string,
  supabaseClient?: SupabaseClient,
): Promise<PartnershipRequestWithDetails[]> {
  const supabase = supabaseClient || getBrowserClient();

  const { data, error } = await supabase
    .from("partnership_requests")
    .select(
      `
      *,
      corporate_campaign:corporate_campaigns!partnership_requests_corporate_campaign_id_fkey(
        id,
        title,
        cause,
        goal_amount
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

  if (error) {
    throw error;
  }

  return data as unknown as PartnershipRequestWithDetails[];
}

export async function updatePartnershipRequestStatus(
  requestId: string,
  status: PartnershipRequestStatus,
  supabaseClient?: SupabaseClient,
) {
  const supabase = supabaseClient || getBrowserClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be logged in to update a partnership request");
  }

  const { data, error } = await supabase
    .from("partnership_requests")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", requestId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function hasAppliedForPartnership(
  corporateCampaignId: string,
  ngoId: string,
  supabaseClient?: SupabaseClient,
): Promise<boolean> {
  const supabase = supabaseClient || getBrowserClient();

  const { data, error } = await supabase
    .from("partnership_requests")
    .select("id")
    .eq("corporate_campaign_id", corporateCampaignId)
    .eq("ngo_id", ngoId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return false;
    }
    throw error;
  }

  return !!data;
}

export async function deletePartnershipRequest(
  requestId: string,
  supabaseClient?: SupabaseClient,
) {
  const supabase = supabaseClient || getBrowserClient();

  const { error } = await supabase
    .from("partnership_requests")
    .delete()
    .eq("id", requestId);

  if (error) {
    throw error;
  }
}
