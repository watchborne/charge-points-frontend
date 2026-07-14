import { NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Local-dev-only shortcut around the magic-link email round-trip.
 *
 * A real magic link works because the browser's own `signInWithOtp` call
 * stores a PKCE code_verifier before the link is ever clicked, so
 * `/auth/callback`'s `exchangeCodeForSession` has something to match the
 * returned code against. The admin API has no such browser-side step, so an
 * admin-generated confirmation link can't be exchanged the same way — hence
 * verifying the generated `email_otp` directly here (server-side, via the
 * anon-key client — this is Supabase's own documented recipe for signing in
 * a user without sending an email) instead of redirecting through
 * `/auth/callback`. This never runs outside this dev-only route, so it
 * doesn't affect the callback's code-exchange-only contract for real magic
 * links.
 *
 * Disabled outside development and whenever `SUPABASE_SERVICE_ROLE_KEY` isn't
 * set (which it never is in a deployed environment), so this can't activate
 * by accident outside a developer's machine.
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production" || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });

  if (error || !data?.properties?.email_otp) {
    return NextResponse.json(
      { error: error?.message ?? "Could not generate a sign-in link" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    type: "magiclink",
    email,
    token: data.properties.email_otp,
  });

  if (verifyError) {
    return NextResponse.json({ error: verifyError.message }, { status: 400 });
  }

  return NextResponse.redirect(new URL("/app/dashboard", request.url));
}
