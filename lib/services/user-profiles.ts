import type { SupabaseClient } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  user_id: string;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  website: string | null;
  twitter_handle: string | null;
  linkedin_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfileWithUser extends UserProfile {
  user: {
    id: string;
    name: string;
    role: string;
  };
}

export interface UserStats {
  total_donations: number;
  donation_count: number;
  volunteer_applications: number;
  posts_created: number;
  comments_made: number;
  badges_earned: number;
  following_count: number;
  follower_count: number;
}

const emptyStats: UserStats = {
  total_donations: 0,
  donation_count: 0,
  volunteer_applications: 0,
  posts_created: 0,
  comments_made: 0,
  badges_earned: 0,
  following_count: 0,
  follower_count: 0,
};

export async function getUserProfile(
  userId: string,
  supabase: SupabaseClient,
): Promise<UserProfileWithUser | null> {
  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select("*, user:users!user_profiles_user_id_fkey(id, name, role)")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !profile) return null;

  return {
    ...profile,
    user: Array.isArray(profile.user) ? profile.user[0] : profile.user,
  } as UserProfileWithUser;
}

export async function getUserStats(
  userId: string,
  supabase: SupabaseClient,
): Promise<UserStats> {
  const { data, error } = await supabase
    .rpc("get_user_stats", { user_uuid: userId })
    .single();

  if (error || !data) return emptyStats;

  const stats = data as Record<keyof UserStats, unknown>;

  return {
    total_donations: Number(stats.total_donations),
    donation_count: Number(stats.donation_count),
    volunteer_applications: Number(stats.volunteer_applications),
    posts_created: Number(stats.posts_created),
    comments_made: Number(stats.comments_made),
    badges_earned: Number(stats.badges_earned),
    following_count: Number(stats.following_count),
    follower_count: Number(stats.follower_count),
  };
}
