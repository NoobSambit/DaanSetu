import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { analyzeContentQuality } from "./gemini";
import type { AIFlag } from "../types/database.types";

/**
 * Flag an NGO or campaign for quality issues
 */
export async function flagEntity(
  entityType: "ngo" | "campaign",
  entityId: string,
  reason: string,
  confidence: string,
  supabase: SupabaseClient,
) {
  const { data, error } = await supabase
    .from("ai_flags")
    .insert({
      entity_type: entityType,
      entity_id: entityId,
      reason,
      confidence,
    })
    .select()
    .single();

  if (error) throw error;
  return data as AIFlag;
}

/**
 * Analyze and flag NGO content if suspicious
 */
export async function analyzeAndFlagNGO(
  ngoId: string,
  title: string,
  description: string,
  supabase: SupabaseClient,
) {
  const analysis = await analyzeContentQuality("ngo", { title, description });

  if (analysis.is_suspicious && analysis.confidence !== "low") {
    await flagEntity(
      "ngo",
      ngoId,
      analysis.reason,
      analysis.confidence,
      supabase,
    );
  }

  return analysis;
}

/**
 * Analyze and flag campaign content if suspicious
 */
export async function analyzeAndFlagCampaign(
  campaignId: string,
  title: string,
  description: string,
  supabase: SupabaseClient,
) {
  const analysis = await analyzeContentQuality("campaign", {
    title,
    description,
  });

  if (analysis.is_suspicious && analysis.confidence !== "low") {
    await flagEntity(
      "campaign",
      campaignId,
      analysis.reason,
      analysis.confidence,
      supabase,
    );
  }

  return analysis;
}
