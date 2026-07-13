import { getBrowserClient } from "@/lib/supabase";
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
  metadata: any;
  created_at: string;
}

export interface ActivityLogWithDetails extends ActivityLog {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

// Create activity log
export async function createActivityLog(
  userId: string,
  activityType: ActivityType,
  entityId?: string,
  entityType?: string,
  metadata?: any,
  supabaseClient?: SupabaseClient,
): Promise<ActivityLog> {
  const supabase = supabaseClient || getBrowserClient();

  const { data: log, error } = await supabase
    .from("activity_logs")
    .insert({
      user_id: userId,
      activity_type: activityType,
      entity_id: entityId || null,
      entity_type: entityType || null,
      metadata: metadata || {},
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating activity log:", error);
    throw new Error("Failed to create activity log");
  }

  return log;
}

// Get user's activity timeline
export async function getUserActivityTimeline(
  userId: string,
  limit: number = 50,
  supabaseClient?: SupabaseClient,
): Promise<ActivityLog[]> {
  const supabase = supabaseClient || getBrowserClient();

  const { data: activities, error } = await supabase
    .from("activity_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error getting activity timeline:", error);
    return [];
  }

  return activities;
}

// Get activity logs by type
export async function getActivityByType(
  userId: string,
  activityType: ActivityType,
  supabaseClient?: SupabaseClient,
): Promise<ActivityLog[]> {
  const supabase = supabaseClient || getBrowserClient();

  const { data: activities, error } = await supabase
    .from("activity_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("activity_type", activityType)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error getting activities by type:", error);
    return [];
  }

  return activities;
}

// Get recent platform activity (for admin or public feed)
export async function getRecentPlatformActivity(
  limit: number = 100,
  supabaseClient?: SupabaseClient,
): Promise<ActivityLogWithDetails[]> {
  const supabase = supabaseClient || getBrowserClient();

  const { data: activities, error } = await supabase
    .from("activity_logs")
    .select(
      `
      *,
      user:users!activity_logs_user_id_fkey(id, name, email, role)
    `,
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error getting platform activity:", error);
    return [];
  }

  return activities.map((activity) => ({
    ...activity,
    user: Array.isArray(activity.user) ? activity.user[0] : activity.user,
  }));
}

// Get activity count by type for a user
export async function getActivityCountByType(
  userId: string,
  activityType: ActivityType,
  supabaseClient?: SupabaseClient,
): Promise<number> {
  const supabase = supabaseClient || getBrowserClient();

  const { count, error } = await supabase
    .from("activity_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("activity_type", activityType);

  if (error) {
    console.error("Error getting activity count:", error);
    return 0;
  }

  return count || 0;
}

// Activity type labels
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

// Activity type icons
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
