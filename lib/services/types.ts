import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Type for optional Supabase client parameter
 * Service functions should accept this and use getBrowserClient() as fallback for backward compatibility
 */
export type ServiceSupabaseClient = SupabaseClient | null | undefined;
