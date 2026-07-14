import { getBrowserClient } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { VolunteerProfile } from "@/lib/types/database.types";

// Get volunteer profile by user ID
export async function getVolunteerProfile(
  userId?: string,
  supabaseClient?: SupabaseClient,
): Promise<VolunteerProfile | null> {
  const supabase = supabaseClient || getBrowserClient();

  let targetUserId = userId;

  if (!targetUserId) {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return null;
    }
    targetUserId = user.id;
  }

  const { data, error } = await supabase
    .from("volunteer_profiles")
    .select("*")
    .eq("user_id", targetUserId)
    .single();

  if (error) {
    return null;
  }

  return data;
}

// Check if user has a volunteer profile
export async function hasVolunteerProfile(
  supabaseClient?: SupabaseClient,
): Promise<boolean> {
  const profile = await getVolunteerProfile(undefined, supabaseClient);
  return profile !== null;
}

// Available skills options
export const VOLUNTEER_SKILLS = [
  "Teaching",
  "Medical",
  "Event Support",
  "Fundraising",
  "Logistics",
  "Technical",
  "Other",
] as const;

// Available availability options
export const VOLUNTEER_AVAILABILITY = [
  "Weekdays",
  "Weekends",
  "Flexible",
] as const;
