import { NextRequest } from "next/server";

import { proxyToBackend } from "@/lib/proxy-request";

// Public endpoint: an alpha access request is submitted from /signup by an
// unauthenticated visitor, so `proxy.ts` exempts this path from the
// session gate. The proxy still injects the shared API key server-side, so the
// backend sees a normal authenticated service-to-service call.
export async function POST(request: NextRequest) {
  return proxyToBackend(request, "/api/access-requests");
}
