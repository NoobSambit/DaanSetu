import { getBrowserClient } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CorporateEmployee } from "@/lib/types/database.types";

export interface CreateEmployeeParams {
  corporateId: string;
  name: string;
  email: string;
  designation?: string;
}

export interface UpdateEmployeeParams {
  employeeId: string;
  name?: string;
  email?: string;
  designation?: string;
}

export async function createEmployee(
  params: CreateEmployeeParams,
  supabaseClient?: SupabaseClient,
) {
  const supabase = supabaseClient || getBrowserClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be logged in to create an employee record");
  }

  const { data, error } = await supabase
    .from("corporate_employees")
    .insert({
      corporate_id: params.corporateId,
      name: params.name,
      email: params.email,
      designation: params.designation || null,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getEmployeesByCorporate(
  corporateId: string,
  supabaseClient?: SupabaseClient,
): Promise<CorporateEmployee[]> {
  const supabase = supabaseClient || getBrowserClient();

  const { data, error } = await supabase
    .from("corporate_employees")
    .select("*")
    .eq("corporate_id", corporateId)
    .order("joined_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

export async function getEmployeeById(
  employeeId: string,
  supabaseClient?: SupabaseClient,
): Promise<CorporateEmployee | null> {
  const supabase = supabaseClient || getBrowserClient();

  const { data, error } = await supabase
    .from("corporate_employees")
    .select("*")
    .eq("id", employeeId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  return data;
}

export async function updateEmployee(
  params: UpdateEmployeeParams,
  supabaseClient?: SupabaseClient,
) {
  const supabase = supabaseClient || getBrowserClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be logged in to update an employee record");
  }

  const updateData: Record<string, any> = {};

  if (params.name) updateData.name = params.name;
  if (params.email) updateData.email = params.email;
  if (params.designation !== undefined)
    updateData.designation = params.designation;

  const { data, error } = await supabase
    .from("corporate_employees")
    .update(updateData)
    .eq("id", params.employeeId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteEmployee(
  employeeId: string,
  supabaseClient?: SupabaseClient,
) {
  const supabase = supabaseClient || getBrowserClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be logged in to delete an employee record");
  }

  const { error } = await supabase
    .from("corporate_employees")
    .delete()
    .eq("id", employeeId);

  if (error) {
    throw error;
  }
}

export async function getEmployeeCount(
  corporateId: string,
  supabaseClient?: SupabaseClient,
): Promise<number> {
  const supabase = supabaseClient || getBrowserClient();

  const { data, error } = await supabase
    .from("corporate_employees")
    .select("id", { count: "exact", head: true })
    .eq("corporate_id", corporateId);

  if (error) {
    throw error;
  }

  return data ? (data as any).count || 0 : 0;
}
