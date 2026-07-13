import { NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Local-dev-only shortcut around the magic-link email round-trip: mints a
 * Supabase confirmation link via the admin API and redirects straight to it,
 * so a developer doesn't have to check their inbox. That confirmation link
 * is the exact same Supabase-hosted `/auth/v1/verify` URL a real email would
 * contain, and it redirects back to our own `/auth/callback`, so session
 * creation still goes through the one real code-exchange path — nothing
 * about `exchangeCodeForSession` is bypassed or duplicated here.
 *
 * Disabled outside development and whenever `SUPABASE_SERVICE_ROLE_KEY` isn't
 * set (which it never is in a deployed environment), so this can't activate
 * by accident outside a developer's machine.
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production" || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams, origin } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${origin}/auth/callback` },
  });

  if (error || !data?.properties?.action_link) {
    return NextResponse.json(
      { error: error?.message ?? "Could not generate a sign-in link" },
      { status: 400 },
    );
  }

  return NextResponse.redirect(data.properties.action_link);
}
