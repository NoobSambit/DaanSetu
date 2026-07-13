import { getBrowserClient } from "@/lib/supabase";
import type { CampaignCategory } from "@/lib/types/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface CreateCampaignParams {
  ngoId: string;
  title: string;
  shortDescription: string;
  description: string;
  goalAmount: number;
  deadline: string;
  imageUrl?: string;
  category: CampaignCategory;
}

export interface UpdateCampaignParams {
  title?: string;
  shortDescription?: string;
  description?: string;
  goalAmount?: number;
  deadline?: string;
  imageUrl?: string;
  category?: CampaignCategory;
  status?: "active" | "completed" | "cancelled";
}

export interface CampaignWithNGO {
  id: string;
  ngo_id: string;
  title: string;
  short_description: string;
  description: string;
  goal_amount: number;
  current_amount: number;
  deadline: string;
  image_url: string | null;
  category: CampaignCategory;
  status: string;
  created_at: string;
  updated_at: string;
  ngos: {
    id: string;
    name: string;
    city: string;
    state: string;
  };
}

export async function createCampaign(
  params: CreateCampaignParams,
  supabaseClient?: SupabaseClient,
) {
  const supabase = supabaseClient || getBrowserClient();

  // Validate deadline is in the future
  const deadlineDate = new Date(params.deadline);
  const now = new Date();
  if (deadlineDate <= now) {
    throw new Error("Campaign deadline must be in the future");
  }

  // Validate goal amount
  if (params.goalAmount <= 0) {
    throw new Error("Goal amount must be greater than 0");
  }

  const { data, error } = await supabase
    .from("campaigns")
    .insert({
      ngo_id: params.ngoId,
      title: params.title,
      short_description: params.shortDescription,
      description: params.description,
      goal_amount: params.goalAmount,
      deadline: params.deadline,
      image_url: params.imageUrl,
      category: params.category,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateCampaign(
  campaignId: string,
  params: UpdateCampaignParams,
  supabaseClient?: SupabaseClient,
) {
  const supabase = supabaseClient || getBrowserClient();

  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (params.title !== undefined) updateData.title = params.title;
  if (params.shortDescription !== undefined)
    updateData.short_description = params.shortDescription;
  if (params.description !== undefined)
    updateData.description = params.description;
  if (params.goalAmount !== undefined)
    updateData.goal_amount = params.goalAmount;
  if (params.deadline !== undefined) updateData.deadline = params.deadline;
  if (params.imageUrl !== undefined) updateData.image_url = params.imageUrl;
  if (params.category !== undefined) updateData.category = params.category;
  if (params.status !== undefined) updateData.status = params.status;

  const { data, error } = await supabase
    .from("campaigns")
    .update(updateData)
    .eq("id", campaignId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getCampaign(
  campaignId: string,
  supabaseClient?: SupabaseClient,
): Promise<CampaignWithNGO> {
  const supabase = supabaseClient || getBrowserClient();

  const { data, error } = await supabase
    .from("campaigns")
    .select(
      `
      *,
      ngos (
        id,
        name,
        city,
        state
      )
    `,
    )
    .eq("id", campaignId)
    .single();

  if (error) {
    throw error;
  }

  return data as unknown as CampaignWithNGO;
}

export async function getAllCampaigns(
  filters?: {
    category?: CampaignCategory;
    sortBy?: "deadline" | "created_at" | "current_amount";
    status?: "active" | "completed" | "cancelled";
    limit?: number;
    offset?: number;
  },
  supabaseClient?: SupabaseClient,
): Promise<CampaignWithNGO[]> {
  const supabase = supabaseClient || getBrowserClient();

  let query = supabase.from("campaigns").select(`
      *,
      ngos (
        id,
        name,
        city,
        state
      )
    `);

  // Apply filters
  if (filters?.category) {
    query = query.eq("category", filters.category);
  }

  if (filters?.status) {
    query = query.eq("status", filters.status);
  } else {
    // By default, only show active campaigns
    query = query.eq("status", "active");
  }

  // Apply sorting
  if (filters?.sortBy === "deadline") {
    query = query.order("deadline", { ascending: true });
  } else if (filters?.sortBy === "current_amount") {
    query = query.order("current_amount", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  // Apply pagination
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(
      filters.offset,
      filters.offset + (filters.limit || 50) - 1,
    );
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data as unknown as CampaignWithNGO[];
}

export async function getNGOCampaigns(
  ngoId: string,
  supabaseClient?: SupabaseClient,
): Promise<CampaignWithNGO[]> {
  const supabase = supabaseClient || getBrowserClient();

  const { data, error } = await supabase
    .from("campaigns")
    .select(
      `
      *,
      ngos (
        id,
        name,
        city,
        state
      )
    `,
    )
    .eq("ngo_id", ngoId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data as unknown as CampaignWithNGO[];
}

/**
 * Increment campaign amount atomically to prevent race conditions
 * Uses database RPC function for atomic updates
 */
export async function incrementCampaignAmount(
  campaignId: string,
  amount: number,
  supabaseClient?: SupabaseClient,
) {
  const supabase = supabaseClient || getBrowserClient();

  // Use RPC function for atomic increment to prevent race conditions
  const { error } = await supabase.rpc("increment_campaign_amount", {
    campaign_id: campaignId,
    amount_to_add: amount,
  });

  if (error) {
    throw error;
  }
}

export async function createCampaignUpdate(
  campaignId: string,
  text: string,
  imageUrl?: string,
  supabaseClient?: SupabaseClient,
) {
  const supabase = supabaseClient || getBrowserClient();

  const { data, error } = await supabase
    .from("campaign_updates")
    .insert({
      campaign_id: campaignId,
      text,
      image_url: imageUrl,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getCampaignUpdates(
  campaignId: string,
  supabaseClient?: SupabaseClient,
) {
  const supabase = supabaseClient || getBrowserClient();

  const { data, error } = await supabase
    .from("campaign_updates")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

export async function getCampaignDonors(
  campaignId: string,
  supabaseClient?: SupabaseClient,
) {
  const supabase = supabaseClient || getBrowserClient();

  const { data, error } = await supabase
    .from("donations")
    .select(
      `
      id,
      amount,
      is_anonymous,
      created_at,
      users (
        name
      )
    `,
    )
    .eq("campaign_id", campaignId)
    .eq("payment_status", "completed")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}
