/**
 * Campaign Enhancement Services
 * Handles campaign templates, milestones, and collaborations
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getBrowserClient } from "@/lib/supabase";

// ============================================================================
// TYPES
// ============================================================================

export interface CampaignTemplate {
  id: string;
  name: string;
  description: string;
  template_category: string;
  default_goal_amount?: number;
  default_duration_days?: number;
  suggested_content?: string;
  image_url?: string;
  created_by?: string;
  is_public: boolean;
  usage_count: number;
  created_at: string;
}

export interface CampaignMilestone {
  id: string;
  campaign_id: string;
  title: string;
  description?: string;
  target_amount: number;
  reward_description?: string;
  achieved: boolean;
  achieved_at?: string;
  milestone_order: number;
  created_at: string;
}

export interface CampaignCollaborator {
  id: string;
  campaign_id: string;
  ngo_id: string;
  role: "owner" | "partner" | "beneficiary";
  funding_percentage?: number;
  joined_at: string;
}

export interface CreateMilestoneParams {
  campaignId: string;
  title: string;
  description?: string;
  targetAmount: number;
  rewardDescription?: string;
  order: number;
}

export interface AddCollaboratorParams {
  campaignId: string;
  ngoId: string;
  role: "partner" | "beneficiary";
  fundingPercentage?: number;
}

// ============================================================================
// CAMPAIGN TEMPLATES
// ============================================================================

/**
 * Get all public campaign templates
 */
export async function getCampaignTemplates(
  category?: string,
  supabaseClient?: SupabaseClient,
): Promise<CampaignTemplate[]> {
  const supabase = supabaseClient || getBrowserClient();

  let query = supabase
    .from("campaign_templates")
    .select("*")
    .eq("is_public", true)
    .order("usage_count", { ascending: false });

  if (category) {
    query = query.eq("template_category", category);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

/**
 * Get template by ID
 */
export async function getCampaignTemplate(
  templateId: string,
  supabaseClient?: SupabaseClient,
): Promise<CampaignTemplate | null> {
  const supabase = supabaseClient || getBrowserClient();

  const { data, error } = await supabase
    .from("campaign_templates")
    .select("*")
    .eq("id", templateId)
    .single();

  if (error) return null;
  return data;
}

/**
 * Increment template usage count
 */
export async function incrementTemplateUsage(
  templateId: string,
  supabaseClient?: SupabaseClient,
) {
  const supabase = supabaseClient || getBrowserClient();

  const { error } = await supabase.rpc("increment_template_usage", {
    template_id: templateId,
  });

  if (error) console.error("Failed to increment template usage:", error);
}

// ============================================================================
// CAMPAIGN MILESTONES
// ============================================================================

/**
 * Create milestone for campaign
 */
export async function createCampaignMilestone(
  params: CreateMilestoneParams,
  supabaseClient?: SupabaseClient,
): Promise<CampaignMilestone> {
  const supabase = supabaseClient || getBrowserClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Verify user owns the campaign
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("ngo_id")
    .eq("id", params.campaignId)
    .single();

  if (!campaign) throw new Error("Campaign not found");

  const { data: ngo } = await supabase
    .from("ngos")
    .select("user_id")
    .eq("id", campaign.ngo_id)
    .single();

  if (!ngo || ngo.user_id !== user.id) {
    throw new Error("Unauthorized: You do not own this campaign");
  }

  // Create milestone
  const { data, error } = await supabase
    .from("campaign_milestones")
    .insert({
      campaign_id: params.campaignId,
      title: params.title,
      description: params.description,
      target_amount: params.targetAmount,
      reward_description: params.rewardDescription,
      milestone_order: params.order,
      achieved: false,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get milestones for a campaign
 */
export async function getCampaignMilestones(
  campaignId: string,
  supabaseClient?: SupabaseClient,
): Promise<CampaignMilestone[]> {
  const supabase = supabaseClient || getBrowserClient();

  const { data, error } = await supabase
    .from("campaign_milestones")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("milestone_order", { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Check and update milestone achievement
 */
export async function checkMilestoneAchievement(
  campaignId: string,
  currentAmount: number,
  supabaseClient?: SupabaseClient,
) {
  const supabase = supabaseClient || getBrowserClient();

  // Get unachieved milestones
  const { data: milestones } = await supabase
    .from("campaign_milestones")
    .select("*")
    .eq("campaign_id", campaignId)
    .eq("achieved", false)
    .lte("target_amount", currentAmount);

  if (!milestones || milestones.length === 0) return;

  // Mark milestones as achieved
  const milestoneIds = milestones.map((m) => m.id);

  const { error } = await supabase
    .from("campaign_milestones")
    .update({
      achieved: true,
      achieved_at: new Date().toISOString(),
    })
    .in("id", milestoneIds);

  if (error) console.error("Failed to update milestones:", error);

  // Create notifications for each achieved milestone
  for (const milestone of milestones) {
    // Notification logic here (can be implemented later)
  }
}

/**
 * Delete milestone
 */
export async function deleteCampaignMilestone(
  milestoneId: string,
  supabaseClient?: SupabaseClient,
) {
  const supabase = supabaseClient || getBrowserClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("campaign_milestones")
    .delete()
    .eq("id", milestoneId);

  if (error) throw error;
}

// ============================================================================
// CAMPAIGN COLLABORATIONS
// ============================================================================

/**
 * Add collaborator to campaign
 */
export async function addCampaignCollaborator(
  params: AddCollaboratorParams,
  supabaseClient?: SupabaseClient,
): Promise<CampaignCollaborator> {
  const supabase = supabaseClient || getBrowserClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Verify user owns the campaign
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("ngo_id")
    .eq("id", params.campaignId)
    .single();

  if (!campaign) throw new Error("Campaign not found");

  const { data: ngo } = await supabase
    .from("ngos")
    .select("user_id")
    .eq("id", campaign.ngo_id)
    .single();

  if (!ngo || ngo.user_id !== user.id) {
    throw new Error("Unauthorized: You do not own this campaign");
  }

  // Add collaborator
  const { data, error } = await supabase
    .from("campaign_collaborators")
    .insert({
      campaign_id: params.campaignId,
      ngo_id: params.ngoId,
      role: params.role,
      funding_percentage: params.fundingPercentage,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      // Unique constraint violation
      throw new Error("This NGO is already a collaborator");
    }
    throw error;
  }

  return data;
}

/**
 * Get campaign collaborators
 */
export async function getCampaignCollaborators(
  campaignId: string,
  supabaseClient?: SupabaseClient,
) {
  const supabase = supabaseClient || getBrowserClient();

  const { data, error } = await supabase
    .from("campaign_collaborators")
    .select(
      `
      *,
      ngo:ngos(id, name, category, city)
    `,
    )
    .eq("campaign_id", campaignId)
    .order("joined_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Remove collaborator
 */
export async function removeCampaignCollaborator(
  collaboratorId: string,
  supabaseClient?: SupabaseClient,
) {
  const supabase = supabaseClient || getBrowserClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("campaign_collaborators")
    .delete()
    .eq("id", collaboratorId);

  if (error) throw error;
}

/**
 * Get campaigns where NGO is a collaborator
 */
export async function getNGOCollaborations(
  ngoId: string,
  supabaseClient?: SupabaseClient,
) {
  const supabase = supabaseClient || getBrowserClient();

  const { data, error } = await supabase
    .from("campaign_collaborators")
    .select(
      `
      *,
      campaign:campaigns(id, title, description, goal_amount, current_amount, status)
    `,
    )
    .eq("ngo_id", ngoId)
    .order("joined_at", { ascending: false });

  if (error) throw error;
  return data || [];
}
