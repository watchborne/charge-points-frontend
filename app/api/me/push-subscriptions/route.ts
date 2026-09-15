import { NextRequest } from "next/server";

import { proxyToBackend } from "@/lib/proxy-request";

// Edge runtime avoids Node.js serverless cold starts on this proxy hop.
export const runtime = "edge";

// Proxies to the backend's POST/DELETE /api/me/push-subscriptions: Web Push
// endpoint registration for the caller's browser (charge-points-server
// issues #587-590, part of the Web Push notification-channel epic). POST is
// an idempotent upsert on `endpoint`; DELETE always returns 204, scoped to
// the caller's own subscriptions server-side.
export async function POST(request: NextRequest) {
  return proxyToBackend(request, "/api/me/push-subscriptions");
}

export async function DELETE(request: NextRequest) {
  return proxyToBackend(request, "/api/me/push-subscriptions");
}
