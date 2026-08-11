import { NextRequest } from "next/server";

import { proxyToBackend } from "@/lib/proxy-request";

// Edge runtime avoids Node.js serverless cold starts on this proxy hop.
export const runtime = "edge";

// Public endpoint, like ../route.ts: LoginForm calls this before the visitor
// has a Supabase session (that's the whole point — deciding whether they may
// get one), so `proxy.ts` exempts this path from the session gate too. The
// proxy still injects the shared API key server-side.
export async function POST(request: NextRequest) {
  return proxyToBackend(request, "/api/access-requests/check-login");
}
