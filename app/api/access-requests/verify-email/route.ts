import { NextRequest } from "next/server";

import { proxyToBackend } from "@/lib/proxy-request";

// Edge runtime avoids Node.js serverless cold starts on this proxy hop.
export const runtime = "edge";

// Public endpoint, like ../route.ts and ../check-login/route.ts: the visitor
// following a confirmation link has no Supabase session (they haven't even
// been approved yet), so proxy.ts exempts this path from the session gate
// too. The proxy still injects the shared API key server-side.
export async function POST(request: NextRequest) {
  return proxyToBackend(request, "/api/access-requests/verify-email");
}
