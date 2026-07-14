import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

type CauseAmount = {
  cause: string;
  amountPaise: number;
  percentage: number;
};

export type LandingStory = {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  authorName: string;
  createdAt: string;
};

export type LandingCampaign = {
  id: string;
  title: string;
  category: string;
  targetPaise: number;
  raisedPaise: number;
  deadline: string;
  imageUrl: string | null;
  ngoId: string | null;
  ngoName: string;
};

export type LandingNgo = {
  id: string;
  name: string;
  tagline: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  category: string | null;
  coverImagePath: string | null;
  isVerified: boolean;
  has80g: boolean;
  averageRating: number;
  totalReviews: number;
};

export type LandingReview = {
  id: string;
  rating: number;
  text: string;
};

export type LandingData = {
  metrics: {
    fundsRaisedPaise: number;
    volunteerHours: number;
    capturedDonations: number;
    activeCampaigns: number;
    statesReached: number;
  };
  causeAmounts: CauseAmount[];
  featuredNgos: LandingNgo[];
  activeCampaigns: LandingCampaign[];
  featuredStory: LandingStory | null;
  latestUpdates: Array<Record<string, unknown>>;
  approvedReviews: LandingReview[];
};

const emptyLandingData: LandingData = {
  metrics: {
    fundsRaisedPaise: 0,
    volunteerHours: 0,
    capturedDonations: 0,
    activeCampaigns: 0,
    statesReached: 0,
  },
  causeAmounts: [],
  featuredNgos: [],
  activeCampaigns: [],
  featuredStory: null,
  latestUpdates: [],
  approvedReviews: [],
};

function causeBreakdown(
  donations: Array<{
    amount_paise: number;
    refunded_paise: number;
    cause: string;
  }>,
): CauseAmount[] {
  const totals = new Map<string, number>();
  for (const donation of donations) {
    const netPaise = Math.max(
      0,
      donation.amount_paise - donation.refunded_paise,
    );
    if (netPaise === 0) continue;
    totals.set(donation.cause, (totals.get(donation.cause) ?? 0) + netPaise);
  }

  const totalPaise = [...totals.values()].reduce(
    (total, amount) => total + amount,
    0,
  );
  return [...totals.entries()]
    .map(([cause, amountPaise]) => ({
      cause,
      amountPaise,
      percentage:
        totalPaise === 0 ? 0 : Math.round((amountPaise / totalPaise) * 100),
    }))
    .sort((left, right) => right.amountPaise - left.amountPaise);
}

export async function getLandingData(): Promise<LandingData> {
  const admin = createAdminClient();
  const [
    donationsResult,
    hoursResult,
    campaignCountResult,
    ngoStatesResult,
    campaignsResult,
    ngosResult,
    storyResult,
    updatesResult,
    reviewsResult,
  ] = await Promise.all([
    admin
      .from("donations")
      .select("amount_paise, refunded_paise, cause")
      .in("status", ["captured", "partially_refunded", "refunded"])
      .eq("is_demo", false),
    admin.from("volunteer_hours").select("hours").eq("status", "approved"),
    admin
      .from("campaigns")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .not("published_at", "is", null),
    admin
      .from("ngos")
      .select("state, operating_states")
      .eq("profile_status", "published")
      .eq("is_discoverable", true),
    admin
      .from("campaigns")
      .select(
        "id, title, category, target_paise, raised_paise, deadline, image_url, ngo_id",
      )
      .eq("status", "active")
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .limit(6),
    admin
      .from("ngos")
      .select(
        "id, name, display_name, tagline, category, city, state, latitude, longitude, logo_path, cover_image_path, is_verified, operating_states, average_rating, total_reviews, ngo_verifications(verification_status, has_80g)",
      )
      .eq("profile_status", "published")
      .eq("is_discoverable", true)
      .order("is_verified", { ascending: false })
      .order("average_rating", { ascending: false })
      .limit(6),
    admin
      .from("posts")
      .select("id, author_id, title, content, image_url, created_at")
      .eq("status", "published")
      .eq("is_impact_story", true)
      .not("approved_at", "is", null)
      .not("featured_at", "is", null)
      .is("hidden_at", null)
      .order("featured_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from("ngo_updates")
      .select("id, ngo_id, title, body, image_path, published_at")
      .eq("status", "published")
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .limit(4),
    admin
      .from("ngo_reviews")
      .select("id, ngo_id, user_id, rating, review_text, created_at")
      .is("hidden_at", null)
      .order("created_at", { ascending: false })
      .limit(4),
  ]);

  const results = [
    donationsResult,
    hoursResult,
    campaignCountResult,
    ngoStatesResult,
    campaignsResult,
    ngosResult,
    storyResult,
    updatesResult,
    reviewsResult,
  ];
  if (results.some((result) => result.error)) {
    console.error("Landing data query failed");
    return emptyLandingData;
  }

  const donations = (donationsResult.data ?? []) as Array<{
    amount_paise: number;
    refunded_paise: number;
    cause: string;
  }>;
  const ngos = (ngosResult.data ?? []) as Array<{
    id: string;
    name: string | null;
    display_name: string | null;
    tagline: string | null;
    city: string | null;
    state: string | null;
    latitude: number | null;
    longitude: number | null;
    category: string | null;
    cover_image_path: string | null;
    is_verified: boolean;
    average_rating: number;
    total_reviews: number;
    operating_states: string[] | null;
    ngo_verifications?: Array<{
      verification_status: string;
      has_80g: boolean;
    }>;
  }>;
  const states = new Set<string>();
  for (const ngo of ngoStatesResult.data ?? []) {
    if (ngo.state) states.add(ngo.state);
    for (const state of ngo.operating_states ?? []) states.add(state);
  }
  const story = storyResult.data as {
    id: string;
    author_id: string;
    title: string;
    content: string;
    image_url: string | null;
    created_at: string;
  } | null;
  let authorName = "DaanSetu community";
  if (story) {
    const { data: author } = await admin
      .from("users")
      .select("name")
      .eq("id", story.author_id)
      .maybeSingle();
    if (author?.name) authorName = author.name;
  }

  return {
    metrics: {
      fundsRaisedPaise: donations.reduce(
        (total, donation) =>
          total + Math.max(0, donation.amount_paise - donation.refunded_paise),
        0,
      ),
      volunteerHours: (hoursResult.data ?? []).reduce(
        (total: number, entry: { hours: number }) => total + entry.hours,
        0,
      ),
      capturedDonations: donations.filter(
        (donation) => donation.amount_paise > donation.refunded_paise,
      ).length,
      activeCampaigns: campaignCountResult.count ?? 0,
      statesReached: states.size,
    },
    causeAmounts: causeBreakdown(donations),
    featuredNgos: ngos.map((ngo) => ({
      id: ngo.id,
      name: ngo.display_name ?? ngo.name ?? "Published NGO",
      tagline: ngo.tagline,
      city: ngo.city,
      state: ngo.state,
      latitude: ngo.latitude,
      longitude: ngo.longitude,
      category: ngo.category,
      coverImagePath: ngo.cover_image_path,
      isVerified: ngo.is_verified,
      has80g: Boolean(
        ngo.ngo_verifications?.some(
          (verification) =>
            verification.verification_status === "verified" &&
            verification.has_80g,
        ),
      ),
      averageRating: ngo.average_rating,
      totalReviews: ngo.total_reviews,
    })),
    activeCampaigns: (campaignsResult.data ?? []).map(
      (campaign: {
        id: string;
        title: string;
        category: string;
        target_paise: number;
        raised_paise: number;
        deadline: string;
        image_url: string | null;
        ngo_id: string | null;
      }) => ({
        id: campaign.id,
        title: campaign.title,
        category: campaign.category,
        targetPaise: campaign.target_paise,
        raisedPaise: campaign.raised_paise,
        deadline: campaign.deadline,
        imageUrl: campaign.image_url,
        ngoId: campaign.ngo_id,
        ngoName:
          ngos.find((ngo) => ngo.id === campaign.ngo_id)?.display_name ??
          ngos.find((ngo) => ngo.id === campaign.ngo_id)?.name ??
          "Community fundraiser",
      }),
    ),
    featuredStory: story
      ? {
          id: story.id,
          title: story.title,
          content: story.content,
          imageUrl: story.image_url,
          authorName,
          createdAt: story.created_at,
        }
      : null,
    latestUpdates: (updatesResult.data ?? []) as Array<Record<string, unknown>>,
    approvedReviews: (reviewsResult.data ?? []).map(
      (review: { id: string; rating: number; review_text: string }) => ({
        id: review.id,
        rating: review.rating,
        text: review.review_text,
      }),
    ),
  };
}
