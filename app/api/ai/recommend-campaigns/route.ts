import { createClient } from "@/lib/supabase/server";
import { generateCampaignRecommendations } from "@/lib/services/gemini";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";

async function handler() {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user's donation causes
    const { data: donations } = await supabase
      .from("donations")
      .select("cause")
      .eq("user_id", user.id)
      .limit(20);

    const donationCauses = [...new Set(donations?.map((d) => d.cause) || [])];

    // Infer browsed categories from donations
    const browsedCategories = [
      ...new Set(
        donations?.map((d) => {
          // Map donation causes to campaign categories
          const causeToCategory: Record<string, string> = {
            education: "education",
            hunger: "food",
            healthcare: "health",
            disaster: "disaster",
            general: "education",
          };
          return causeToCategory[d.cause] || d.cause;
        }) || [],
      ),
    ];

    // Fetch all active campaigns (for context and matching)
    const { data: campaigns } = await supabase
      .from("campaigns")
      .select("id, title, category, short_description, goal_amount")
      .eq("status", "active")
      .limit(30);

    if (!campaigns || campaigns.length === 0) {
      return NextResponse.json({ recommendations: [] });
    }

    // Generate AI recommendations
    const aiRecommendations = await generateCampaignRecommendations({
      donationCauses,
      browsedCategories,
      campaigns: campaigns.map((c) => ({
        id: c.id,
        title: c.title,
        category: c.category,
        short_description: c.short_description,
      })),
    });

    // Match AI recommendations with actual campaign data
    const recommendations = aiRecommendations
      .map((rec) => {
        const campaign = campaigns.find(
          (c) => c.title.toLowerCase() === rec.campaign_title.toLowerCase(),
        );
        if (campaign) {
          return {
            campaign_id: campaign.id,
            campaign_title: campaign.title,
            reason: rec.reason,
            category: campaign.category,
            short_description: campaign.short_description,
          };
        }
        return null;
      })
      .filter(Boolean);

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error("Error in recommend-campaigns API:", error);
    return NextResponse.json(
      { error: "Failed to generate campaign recommendations" },
      { status: 500 },
    );
  }
}

export const POST = rateLimit(RATE_LIMITS.AI)(handler);
