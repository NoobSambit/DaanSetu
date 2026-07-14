import type { SupabaseClient } from "@supabase/supabase-js";

export type ActivityType =
  | "donation"
  | "volunteer_application"
  | "post_created"
  | "post_liked"
  | "post_commented"
  | "campaign_created"
  | "badge_earned"
  | "follow";

export interface ActivityLog {
  id: string;
  user_id: string;
  activity_type: ActivityType;
  entity_id: string | null;
  entity_type: string | null;
  metadata: Record<string, string | number | boolean | null>;
  created_at: string;
}

export async function getUserActivityTimeline(
  userId: string,
  limit: number,
  supabase: SupabaseClient,
): Promise<ActivityLog[]> {
  const boundedLimit = Math.max(1, Math.min(limit, 100));
  const { data, error } = await supabase
    .from("activity_logs")
    .select(
      "id, user_id, activity_type, entity_id, entity_type, metadata, created_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(boundedLimit);

  if (error) return [];
  return (data ?? []) as ActivityLog[];
}

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  donation: "Made a donation",
  volunteer_application: "Applied to volunteer",
  post_created: "Created a post",
  post_liked: "Liked a post",
  post_commented: "Commented on a post",
  campaign_created: "Created a campaign",
  badge_earned: "Earned a badge",
  follow: "Followed someone",
};

export const ACTIVITY_TYPE_ICONS: Record<ActivityType, string> = {
  donation: "💝",
  volunteer_application: "🙋",
  post_created: "📝",
  post_liked: "❤️",
  post_commented: "💬",
  campaign_created: "🎯",
  badge_earned: "🏆",
  follow: "🤝",
};
