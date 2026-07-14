import type { SupabaseClient } from "@supabase/supabase-js";

import { getBrowserClient } from "@/lib/supabase";
import type { CorporateEmployee } from "@/lib/types/database.types";

export async function getEmployeesByCorporate(
  corporateId: string,
  supabaseClient?: SupabaseClient,
): Promise<CorporateEmployee[]> {
  const supabase = supabaseClient ?? getBrowserClient();
  const { data, error } = await supabase
    .from("corporate_employees")
    .select("id, corporate_id, user_id, name, email, designation, joined_at")
    .eq("corporate_id", corporateId)
    .order("joined_at", { ascending: false });

  if (error) throw new Error("Employees could not be loaded");
  return (data ?? []) as CorporateEmployee[];
}
