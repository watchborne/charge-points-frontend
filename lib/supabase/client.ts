import { createBrowserClient } from "@supabase/ssr";

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/constants";

/**
 * Supabase client for use in Client Components (browser). Reads and writes the
 * session from the browser's cookie store. Safe to call per render — the
 * underlying client is cheap to construct.
 */
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
