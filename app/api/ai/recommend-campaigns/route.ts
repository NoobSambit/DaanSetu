import { NextRequest, NextResponse } from "next/server";

import { rankRecommendations } from "@/lib/domain/recommendations";
import { rateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { hasValidRequestOrigin } from "@/lib/security/origin";
import { generateCampaignRecommendations } from "@/lib/services/gemini";
import { createClient } from "@/lib/supabase/server";

const causeCategory: Record<string, string> = {
  education: "education",
  hunger: "food",
  healthcare: "health",
  disaster: "disaster",
  general: "education",
};

async function handler(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) {
    return NextResponse.json(
      { error: "Invalid request origin" },
      { status: 403 },
    );
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email_confirmed_at) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [{ data: donations }, { data: campaigns }] = await Promise.all([
    supabase
      .from("donations")
      .select("cause, campaign_id")
      .eq("user_id", user.id)
      .eq("status", "captured")
      .eq("is_demo", false)
      .eq("is_csr_match", false)
      .limit(100),
    supabase
      .from("campaigns")
      .select("id, title, category, short_description")
      .eq("status", "active")
      .limit(100),
  ]);
  if (!campaigns?.length) {
    return NextResponse.json({ recommendations: [] });
  }

  const categories = [
    ...new Set((donations ?? []).map((item) => causeCategory[item.cause])),
  ].filter(Boolean);
  const donatedCampaigns = new Set(
    (donations ?? []).map((item) => item.campaign_id),
  );
  const ranked = rankRecommendations(
    campaigns.map((campaign) => ({
      ...campaign,
      priorDonation: donatedCampaigns.has(campaign.id),
    })),
    { categories, skills: [] },
  ).slice(0, 6);
  const enhanced = await generateCampaignRecommendations({
    donationCauses: (donations ?? []).map((item) => item.cause),
    browsedCategories: [...categories],
    campaigns: ranked,
  });
  const explanations = new Map(
    enhanced.map((item) => [item.campaign_title, item.reason]),
  );

  return NextResponse.json({
    recommendations: ranked.map((campaign) => ({
      campaign_id: campaign.id,
      campaign_title: campaign.title,
      category: campaign.category,
      short_description: campaign.short_description,
      score: campaign.score,
      reason:
        explanations.get(campaign.title) ??
        (campaign.score > 0
          ? "Recommended from your verified giving history and cause interests."
          : "An active fundraiser available to explore on DaanSetu."),
    })),
  });
}

export const POST = rateLimit(RATE_LIMITS.AI)(handler);
