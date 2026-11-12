import { NextRequest, NextResponse } from "next/server";

import { contactMessageSchema } from "@/lib/contact-message";
import { contactRateLimiter } from "@/lib/contact-rate-limit";
import { proxyToBackend } from "@/lib/proxy-request";
import { getClientIp } from "@/lib/rate-limit";

// Public: submitted from /contact without a session. A malformed submission is
// refused here; the backend validates it again, emails it to the team and
// acknowledges the sender. The backend's own limit is one bucket for every
// proxied visitor, so this per-client limit stands in front of it: one scripted
// client must not use up the budget of the others.
export async function POST(request: NextRequest) {
  const limit = contactRateLimiter.check(getClientIp(request.headers));
  if (!limit.allowed) {
    return NextResponse.json(
      { code: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  // Read from a clone: the relay forwards the original body untouched.
  const payload = await request
    .clone()
    .json()
    .catch(() => null);
  if (!contactMessageSchema.safeParse(payload).success) {
    return NextResponse.json({ code: "INVALID_INPUT" }, { status: 400 });
  }

  return proxyToBackend(request, "/api/contact");
}
