import { createClient } from "@supabase/supabase-js";

import { SUPABASE_URL } from "@/lib/constants";

/**
 * Service-role Supabase client — local-dev tooling only (see
 * `app/auth/dev-login/route.ts`). The service role key bypasses Row Level
 * Security entirely, so this must never be constructed outside a code path
 * that is itself gated to development. `SUPABASE_SERVICE_ROLE_KEY` should
 * only ever be set in a local `.env.local`, never in a deployed environment.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }

  return createClient(SUPABASE_URL, serviceRoleKey);
}
