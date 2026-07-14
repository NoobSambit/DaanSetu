import type { SupabaseClient } from "@supabase/supabase-js";

import { getBrowserClient } from "@/lib/supabase";
import type {
  CorporateProfile,
  CorporateSize,
} from "@/lib/types/database.types";

export async function getCorporateProfile(
  userId?: string,
  supabaseClient?: SupabaseClient,
): Promise<CorporateProfile | null> {
  const supabase = supabaseClient ?? getBrowserClient();
  let targetUserId = userId;

  if (!targetUserId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    targetUserId = user.id;
  }

  const { data, error } = await supabase
    .from("corporate_profiles")
    .select(
      "id, user_id, company_name, industry, company_size, description, website, logo_url, verified, created_at, updated_at",
    )
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (error) throw new Error("Corporate profile could not be loaded");
  return data as CorporateProfile | null;
}

export const INDUSTRIES = [
  "Technology",
  "Finance",
  "Healthcare",
  "Education",
  "Manufacturing",
  "Retail",
  "Telecommunications",
  "Energy",
  "Agriculture",
  "Real Estate",
  "Hospitality",
  "Transportation",
  "Media",
  "Consulting",
  "Other",
] as const;

export const COMPANY_SIZES: CorporateSize[] = [
  "1-50",
  "51-200",
  "201-500",
  "501-1000",
  "1000+",
];
