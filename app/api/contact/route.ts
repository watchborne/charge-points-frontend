import { NextRequest, NextResponse } from "next/server";

import { contactRateLimiter } from "@/lib/contact-rate-limit";
import { proxyToBackend } from "@/lib/proxy-request";
import { getClientIp } from "@/lib/rate-limit";

// Public: submitted from /contact without a session. The backend validates the
// message, emails it to the team and acknowledges the sender. The backend's own
// limit is one bucket for every proxied visitor, so this per-client limit stands
// in front of it: one scripted client must not use up the budget of the others.
export async function POST(request: NextRequest) {
  const limit = contactRateLimiter.check(getClientIp(request.headers));
  if (!limit.allowed) {
    return NextResponse.json(
      { code: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  return proxyToBackend(request, "/api/contact");
}
