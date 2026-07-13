import { createClient } from "@/lib/supabase/server";
import { generateNGORecommendations } from "@/lib/services/gemini";
import { NextResponse, NextRequest } from "next/server";
import { rateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";

async function handler(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user's donation causes
    const { data: donations } = await supabase
      .from("donations")
      .select("cause")
      .eq("user_id", userId)
      .limit(20);

    const donationCauses = [...new Set(donations?.map((d) => d.cause) || [])];

    // Fetch volunteer skills (if profile exists)
    const { data: volunteerProfile } = await supabase
      .from("volunteer_profiles")
      .select("skills")
      .eq("user_id", userId)
      .single();

    const volunteerSkills = volunteerProfile?.skills || [];

    // Fetch all NGOs (for context and matching)
    const { data: ngos } = await supabase
      .from("ngos")
      .select("id, name, category, description")
      .eq("profile_status", "published")
      .eq("is_discoverable", true)
      .limit(50);

    if (!ngos || ngos.length === 0) {
      return NextResponse.json({ recommendations: [] });
    }

    // Infer browsed categories from donations
    const browsedCategories = [
      ...new Set(
        donations?.map((d) => {
          // Map donation causes to NGO categories
          const causeToCategory: Record<string, string> = {
            education: "education",
            hunger: "food",
            healthcare: "health",
            disaster: "health",
            general: "education",
          };
          return causeToCategory[d.cause] || d.cause;
        }) || [],
      ),
    ];

    // Generate AI recommendations
    const aiRecommendations = await generateNGORecommendations({
      donationCauses,
      browsedCategories,
      volunteerSkills,
      ngoList: ngos.map((ngo) => ({
        id: ngo.id,
        name: ngo.name,
        category: ngo.category,
        description: ngo.description,
      })),
    });

    // Match AI recommendations with actual NGO data
    const recommendations = aiRecommendations
      .map((rec) => {
        const ngo = ngos.find(
          (n) => n.name.toLowerCase() === rec.ngo_name.toLowerCase(),
        );
        if (ngo) {
          return {
            ngo_id: ngo.id,
            ngo_name: ngo.name,
            reason: rec.reason,
            category: ngo.category,
          };
        }
        return null;
      })
      .filter(Boolean);

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error("Error in recommend-ngos API:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 },
    );
  }
}

// Apply rate limiting to AI endpoint
export const POST = rateLimit(RATE_LIMITS.AI)(handler);
