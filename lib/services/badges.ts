import { getBrowserClient } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserBadge, BadgeType } from "@/lib/types/database.types";

export interface BadgeInfo {
  type: BadgeType;
  name: string;
  description: string;
  emoji: string;
}

// Badge definitions
export const BADGE_INFO: Record<BadgeType, Omit<BadgeInfo, "type">> = {
  donor_hero: {
    name: "Donor Hero",
    description: "Donated over ₹10,000",
    emoji: "💛",
  },
  volunteer_champ: {
    name: "Volunteer Champ",
    description: "Completed 5+ volunteer opportunities",
    emoji: "🌟",
  },
  csr_star: {
    name: "CSR Star",
    description: "Corporate with 3+ CSR campaigns",
    emoji: "🏆",
  },
  campaign_supporter: {
    name: "Campaign Supporter",
    description: "Supported 5+ campaigns",
    emoji: "🎯",
  },
  community_builder: {
    name: "Community Builder",
    description: "Created 10+ posts",
    emoji: "🤝",
  },
  impact_maker: {
    name: "Impact Maker",
    description: "Made donations, volunteered, and supported campaigns",
    emoji: "✨",
  },
};

// Award a badge to a user
export async function awardBadge(
  userId: string,
  badgeType: BadgeType,
  supabaseClient?: SupabaseClient,
): Promise<UserBadge | null> {
  const supabase = supabaseClient || getBrowserClient();

  // Check if user already has this badge
  const { data: existing } = await supabase
    .from("user_badges")
    .select("id")
    .eq("user_id", userId)
    .eq("badge_type", badgeType)
    .single();

  if (existing) {
    return null; // Badge already awarded
  }

  const { data: badge, error } = await supabase
    .from("user_badges")
    .insert({ user_id: userId, badge_type: badgeType })
    .select()
    .single();

  if (error) {
    console.error("Error awarding badge:", error);
    return null;
  }

  return badge;
}

// Get all badges for a user
export async function getUserBadges(
  userId: string,
  supabaseClient?: SupabaseClient,
): Promise<UserBadge[]> {
  const supabase = supabaseClient || getBrowserClient();

  const { data: badges, error } = await supabase
    .from("user_badges")
    .select("*")
    .eq("user_id", userId)
    .order("earned_at", { ascending: false });

  if (error) {
    console.error("Error fetching user badges:", error);
    return [];
  }

  return badges || [];
}

// Check if user has a specific badge
export async function hasUserBadge(
  userId: string,
  badgeType: BadgeType,
  supabaseClient?: SupabaseClient,
): Promise<boolean> {
  const supabase = supabaseClient || getBrowserClient();

  const { data, error } = await supabase
    .from("user_badges")
    .select("id")
    .eq("user_id", userId)
    .eq("badge_type", badgeType)
    .single();

  return !error && !!data;
}

// Check and award badges based on user activity
export async function checkAndAwardBadges(
  userId: string,
  supabaseClient?: SupabaseClient,
): Promise<UserBadge[]> {
  const supabase = supabaseClient || getBrowserClient();
  const newBadges: UserBadge[] = [];

  // Get user data
  const { data: user } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  if (!user) return newBadges;

  // Check Donor Hero (₹10,000+ donated)
  const { data: donationStats } = await supabase
    .from("donations")
    .select("amount")
    .eq("user_id", userId)
    .eq("payment_status", "completed");

  const totalDonated =
    donationStats?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
  if (totalDonated >= 10000) {
    const badge = await awardBadge(userId, "donor_hero", supabaseClient);
    if (badge) newBadges.push(badge);
  }

  // Check Volunteer Champ (5+ accepted applications)
  const { count: volunteerCount } = await supabase
    .from("volunteer_applications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "accepted");

  if (volunteerCount && volunteerCount >= 5) {
    const badge = await awardBadge(userId, "volunteer_champ", supabaseClient);
    if (badge) newBadges.push(badge);
  }

  // Check CSR Star (3+ CSR campaigns for corporates)
  if (user.role === "corporate") {
    const { data: corporateProfile } = await supabase
      .from("corporate_profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (corporateProfile) {
      const { count: campaignCount } = await supabase
        .from("corporate_campaigns")
        .select("*", { count: "exact", head: true })
        .eq("corporate_id", corporateProfile.id);

      if (campaignCount && campaignCount >= 3) {
        const badge = await awardBadge(userId, "csr_star", supabaseClient);
        if (badge) newBadges.push(badge);
      }
    }
  }

  // Check Campaign Supporter (5+ campaigns supported)
  const { data: campaignDonations } = await supabase
    .from("donations")
    .select("campaign_id")
    .eq("user_id", userId)
    .eq("payment_status", "completed")
    .not("campaign_id", "is", null);

  const uniqueCampaigns = new Set(campaignDonations?.map((d) => d.campaign_id));
  if (uniqueCampaigns.size >= 5) {
    const badge = await awardBadge(
      userId,
      "campaign_supporter",
      supabaseClient,
    );
    if (badge) newBadges.push(badge);
  }

  // Check Community Builder (10+ posts for NGO/Corporate/Admin)
  if (["ngo", "corporate", "admin"].includes(user.role)) {
    const { count: postCount } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("author_id", userId);

    if (postCount && postCount >= 10) {
      const badge = await awardBadge(
        userId,
        "community_builder",
        supabaseClient,
      );
      if (badge) newBadges.push(badge);
    }
  }

  // Check Impact Maker (has donated, volunteered, and supported campaigns)
  const hasDonated = totalDonated > 0;
  const hasVolunteered = volunteerCount && volunteerCount > 0;
  const hasSupportedCampaigns = uniqueCampaigns.size > 0;

  if (hasDonated && hasVolunteered && hasSupportedCampaigns) {
    const badge = await awardBadge(userId, "impact_maker", supabaseClient);
    if (badge) newBadges.push(badge);
  }

  return newBadges;
}

// Get badge count for a user
export async function getUserBadgeCount(
  userId: string,
  supabaseClient?: SupabaseClient,
): Promise<number> {
  const supabase = supabaseClient || getBrowserClient();

  const { count, error } = await supabase
    .from("user_badges")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    console.error("Error getting badge count:", error);
    return 0;
  }

  return count || 0;
}
