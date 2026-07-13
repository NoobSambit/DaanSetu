import { getBrowserClient } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CorporateProfile,
  CorporateSize,
} from "@/lib/types/database.types";

export interface CreateCorporateProfileParams {
  companyName: string;
  industry: string;
  companySize: CorporateSize;
  description?: string;
  website?: string;
  logoUrl?: string;
}

export interface UpdateCorporateProfileParams {
  companyName?: string;
  industry?: string;
  companySize?: CorporateSize;
  description?: string;
  website?: string;
  logoUrl?: string;
}

export async function createCorporateProfile(
  params: CreateCorporateProfileParams,
  supabaseClient?: SupabaseClient,
) {
  const supabase = supabaseClient || getBrowserClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be logged in to create a corporate profile");
  }

  const { data, error } = await supabase
    .from("corporate_profiles")
    .insert({
      user_id: user.id,
      company_name: params.companyName,
      industry: params.industry,
      company_size: params.companySize,
      description: params.description || null,
      website: params.website || null,
      logo_url: params.logoUrl || null,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getCorporateProfile(
  userId?: string,
  supabaseClient?: SupabaseClient,
): Promise<CorporateProfile | null> {
  const supabase = supabaseClient || getBrowserClient();

  let targetUserId = userId;

  if (!targetUserId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return null;
    }
    targetUserId = user.id;
  }

  const { data, error } = await supabase
    .from("corporate_profiles")
    .select("*")
    .eq("user_id", targetUserId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  return data;
}

export async function getCorporateProfileById(
  corporateId: string,
  supabaseClient?: SupabaseClient,
): Promise<CorporateProfile | null> {
  const supabase = supabaseClient || getBrowserClient();

  const { data, error } = await supabase
    .from("corporate_profiles")
    .select("*")
    .eq("id", corporateId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  return data;
}

export async function updateCorporateProfile(
  params: UpdateCorporateProfileParams,
  supabaseClient?: SupabaseClient,
) {
  const supabase = supabaseClient || getBrowserClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be logged in to update a corporate profile");
  }

  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (params.companyName) updateData.company_name = params.companyName;
  if (params.industry) updateData.industry = params.industry;
  if (params.companySize) updateData.company_size = params.companySize;
  if (params.description !== undefined)
    updateData.description = params.description;
  if (params.website !== undefined) updateData.website = params.website;
  if (params.logoUrl !== undefined) updateData.logo_url = params.logoUrl;

  const { data, error } = await supabase
    .from("corporate_profiles")
    .update(updateData)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function hasCorporateProfile(
  supabaseClient?: SupabaseClient,
): Promise<boolean> {
  const supabase = supabaseClient || getBrowserClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { data, error } = await supabase
    .from("corporate_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return false;
    }
    throw error;
  }

  return !!data;
}

export async function getAllCorporateProfiles(
  supabaseClient?: SupabaseClient,
): Promise<CorporateProfile[]> {
  const supabase = supabaseClient || getBrowserClient();

  const { data, error } = await supabase
    .from("corporate_profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
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
];

export const COMPANY_SIZES: CorporateSize[] = [
  "1-50",
  "51-200",
  "201-500",
  "501-1000",
  "1000+",
];
