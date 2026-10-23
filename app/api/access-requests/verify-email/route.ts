import { NextRequest } from "next/server";

import { proxyToBackend } from "@/lib/proxy-request";

export const runtime = "edge";

// Public: the visitor following a confirmation link has no session. The
// proxy still injects the API key.
export async function POST(request: NextRequest) {
  return proxyToBackend(request, "/api/access-requests/verify-email");
}
