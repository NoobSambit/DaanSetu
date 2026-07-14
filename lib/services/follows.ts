import type { SupabaseClient } from "@supabase/supabase-js";

export type FollowingType = "user" | "ngo" | "corporate";

export async function isFollowing(
  followerId: string,
  followingId: string,
  followingType: FollowingType,
  supabase: SupabaseClient,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_following", {
    user_uuid: followerId,
    entity_uuid: followingId,
    entity_type_param: followingType,
  });

  if (error) return false;
  return Boolean(data);
}
