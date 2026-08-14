import { NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Local-dev-only shortcut around the real OTP-code email round-trip.
 *
 * Returns the code itself (`properties.email_otp` from the admin API)
 * instead of creating a session server-side: `DevLoginShortcut` feeds it
 * into `VerifyOtpForm`, which runs the same client-side
 * `supabase.auth.verifyOtp` call a real user's browser would after reading
 * the code from their inbox. Skips the real email, but exercises the actual
 * sign-in path — unlike this route's magic-link-era version, which had to
 * verify a `token_hash` server-side (a real magic link's PKCE exchange can
 * only be driven by the browser that requested it — ADR 0005, charge-points-server).
 *
 * Disabled outside development, whenever `SUPABASE_SERVICE_ROLE_KEY` isn't
 * set (never in a deployed environment), and unless `ENABLE_DEV_LOGIN=true`
 * is explicit. That second flag means a misconfigured non-prod deployment
 * with the service-role key set (e.g. preview/staging) still can't mint a
 * code for an arbitrary email — it can't activate by accident outside a dev machine.
 */
export async function GET(request: NextRequest) {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.ENABLE_DEV_LOGIN !== "true" ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
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
      { error: error?.message ?? "Could not generate a code" },
      { status: 400 },
    );
  }

  return NextResponse.json({ code: data.properties.email_otp });
}
