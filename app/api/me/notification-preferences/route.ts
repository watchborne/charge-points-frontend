import { NextRequest } from "next/server";

import { proxyToBackend } from "@/lib/proxy-request";

// Edge runtime avoids Node.js serverless cold starts on this proxy hop.
export const runtime = "edge";

// Proxies to the backend's GET/PATCH /api/me/notification-preferences: the
// caller's own digest opt-in/out and preferred digest send hour (UTC).
export async function GET(request: NextRequest) {
  return proxyToBackend(request, "/api/me/notification-preferences");
}

export async function PATCH(request: NextRequest) {
  return proxyToBackend(request, "/api/me/notification-preferences");
}
