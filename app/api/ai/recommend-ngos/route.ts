import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { rankRecommendations } from "@/lib/domain/recommendations";
import { rateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { hasValidRequestOrigin } from "@/lib/security/origin";
import { generateNGORecommendations } from "@/lib/services/gemini";
import { createClient } from "@/lib/supabase/server";

const requestSchema = z.object({ userId: z.string().uuid() });

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
  const parsed = requestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email_confirmed_at || user.id !== parsed.data.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [
    donationsResult,
    volunteerResult,
    followsResult,
    activityResult,
    ngosResult,
  ] = await Promise.all([
    supabase
      .from("donations")
      .select("cause, ngo_id")
      .eq("user_id", user.id)
      .eq("status", "captured")
      .eq("is_demo", false)
      .eq("is_csr_match", false)
      .limit(100),
    supabase
      .from("volunteer_profiles")
      .select("skills, city")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id)
      .eq("following_type", "ngo"),
    supabase
      .from("activity_logs")
      .select("entity_id")
      .eq("user_id", user.id)
      .eq("entity_type", "ngo")
      .gte(
        "created_at",
        new Date(Date.now() - 90 * 24 * 60 * 60_000).toISOString(),
      )
      .limit(100),
    supabase
      .from("ngos")
      .select("id, name, category, description, city, state")
      .eq("profile_status", "published")
      .eq("is_discoverable", true)
      .limit(100),
  ]);
  const ngos = ngosResult.data ?? [];
  if (ngos.length === 0) {
    return NextResponse.json({ recommendations: [] });
  }

  const donations = donationsResult.data ?? [];
  const categories = [
    ...new Set(donations.map((donation) => causeCategory[donation.cause])),
  ].filter(Boolean);
  const donatedNgoIds = new Set(donations.map((donation) => donation.ngo_id));
  const followedNgoIds = new Set(
    (followsResult.data ?? []).map((follow) => follow.following_id),
  );
  const recentNgoIds = new Set(
    (activityResult.data ?? []).map((activity) => activity.entity_id),
  );
  const ranked = rankRecommendations(
    ngos.map((ngo) => ({
      ...ngo,
      followed: followedNgoIds.has(ngo.id),
      priorDonation: donatedNgoIds.has(ngo.id),
      recentActivity: recentNgoIds.has(ngo.id),
    })),
    {
      categories,
      skills: volunteerResult.data?.skills ?? [],
      city: volunteerResult.data?.city ?? null,
    },
  ).slice(0, 6);

  const enhanced = await generateNGORecommendations({
    donationCauses: donations.map((donation) => donation.cause),
    browsedCategories: [...categories],
    volunteerSkills: [...(volunteerResult.data?.skills ?? [])],
    ngoList: ranked.map((ngo) => ({
      id: ngo.id,
      name: ngo.name,
      category: ngo.category,
      description: ngo.description,
    })),
  });
  const explanations = new Map(
    enhanced.map((item) => [item.ngo_name, item.reason]),
  );
  const recommendations = ranked.map((ngo) => ({
    ngo_id: ngo.id,
    ngo_name: ngo.name,
    category: ngo.category,
    score: ngo.score,
    reason:
      explanations.get(ngo.name) ??
      (ngo.score > 0
        ? "Recommended from your causes, skills, location, follows, and recent activity."
        : "A verified organization available to explore on DaanSetu."),
  }));

  return NextResponse.json({ recommendations });
}

export const POST = rateLimit(RATE_LIMITS.AI)(handler);
