import type { SupabaseClient } from '@supabase/supabase-js'

import type { UserRole } from './types'

export async function getUserRole(
  supabase: SupabaseClient,
  userId: string
): Promise<UserRole | null> {
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return data.role as UserRole
}
