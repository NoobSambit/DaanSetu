import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  analyzeAndFlagNGO,
  analyzeAndFlagCampaign,
} from "@/lib/services/ai-flags";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { hasValidRequestOrigin } from "@/lib/security/origin";

async function handler(request: NextRequest) {
  try {
    if (!hasValidRequestOrigin(request)) {
      return NextResponse.json(
        { error: "Invalid request origin" },
        { status: 403 },
      );
    }
    const { entityType, entityId } = await request.json();

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: "Entity type and ID are required" },
        { status: 400 },
      );
    }

    if (entityType !== "ngo" && entityType !== "campaign") {
      return NextResponse.json(
        { error: "Invalid entity type" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Check authentication (admin only for manual flagging)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let analysis;

    if (entityType === "ngo") {
      // Fetch NGO details
      const { data: ngo } = await supabase
        .from("ngos")
        .select("id, name, description")
        .eq("id", entityId)
        .single();

      if (!ngo) {
        return NextResponse.json({ error: "NGO not found" }, { status: 404 });
      }

      analysis = await analyzeAndFlagNGO(
        ngo.id,
        ngo.name,
        ngo.description,
        createAdminClient(),
      );
    } else {
      // Fetch campaign details
      const { data: campaign } = await supabase
        .from("campaigns")
        .select("id, title, description")
        .eq("id", entityId)
        .single();

      if (!campaign) {
        return NextResponse.json(
          { error: "Campaign not found" },
          { status: 404 },
        );
      }

      analysis = await analyzeAndFlagCampaign(
        campaign.id,
        campaign.title,
        campaign.description,
        createAdminClient(),
      );
    }

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("Error in analyze-content API:", error);
    return NextResponse.json(
      { error: "Failed to analyze content" },
      { status: 500 },
    );
  }
}

export const POST = rateLimit(RATE_LIMITS.AI)(handler);
