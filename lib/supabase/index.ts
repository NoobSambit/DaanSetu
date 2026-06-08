/**
 * Unified Supabase Client Utility
 *
 * This module provides a safe way to access Supabase in both server and client contexts.
 * It automatically detects the environment and returns the appropriate client.
 */

import { createClient as createBrowserClient } from './client'
import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Check if we're running on the server
 */
function isServer(): boolean {
  return typeof window === 'undefined'
}

/**
 * Get a Supabase client appropriate for the current context
 *
 * IMPORTANT: This is a synchronous wrapper, but the server client creation is async.
 * For server-side code, prefer using createServerClient() directly and await it.
 * This utility is mainly for shared code that needs to work in both contexts.
 */
export function getSupabaseClient(): SupabaseClient {
  if (isServer()) {
    // For server context, we need to use the server client
    // However, this is problematic because createServerClient is async
    throw new Error(
      'Cannot use getSupabaseClient() in server context. ' +
      'Use createServerClient() from @/lib/supabase/server instead and await it.'
    )
  }

  return createBrowserClient()
}

/**
 * Get a browser-safe Supabase client
 * Use this in client components and client-side code
 */
export function getBrowserClient(): SupabaseClient {
  return createBrowserClient()
}

// Keep this shared entry point browser-safe. Server code should import
// createClient directly from '@/lib/supabase/server'.
export { createClient as createBrowserClient } from './client'
