import type { SupabaseClient } from "@supabase/supabase-js";

import { getBrowserClient } from "@/lib/supabase";
import type { Notification } from "@/lib/types/database.types";

export async function getUserNotifications(
  userId: string,
  limit = 50,
  supabaseClient?: SupabaseClient,
): Promise<Notification[]> {
  const boundedLimit = Math.max(1, Math.min(limit, 100));
  const supabase = supabaseClient ?? getBrowserClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, user_id, type, title, message, link, is_read, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(boundedLimit);

  if (error) return [];
  return (data ?? []) as Notification[];
}
