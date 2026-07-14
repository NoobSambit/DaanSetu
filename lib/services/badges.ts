import type { SupabaseClient } from "@supabase/supabase-js";

import type { BadgeType, UserBadge } from "@/lib/types/database.types";

export interface BadgeInfo {
  name: string;
  description: string;
  emoji: string;
}

export const BADGE_INFO: Record<BadgeType, BadgeInfo> = {
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
    description: "Donated, volunteered, and supported campaigns",
    emoji: "✨",
  },
};

export async function getUserBadges(
  userId: string,
  supabase: SupabaseClient,
): Promise<UserBadge[]> {
  const { data, error } = await supabase
    .from("user_badges")
    .select("id, user_id, badge_type, earned_at")
    .eq("user_id", userId)
    .order("earned_at", { ascending: false });

  if (error) return [];
  return (data ?? []) as UserBadge[];
}
