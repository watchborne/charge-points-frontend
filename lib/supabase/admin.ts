import { createClient } from "@supabase/supabase-js";

import { SUPABASE_URL } from "@/lib/constants";

/**
 * Service-role client for `app/auth/dev-login/route.ts` only. The key bypasses
 * Row Level Security, so it must only be constructed on a dev-gated path, and
 * set only in a local `.env.local`.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }

  return createClient(SUPABASE_URL, serviceRoleKey);
}
