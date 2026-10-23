import { NextRequest } from "next/server";

import { proxyToBackend } from "@/lib/proxy-request";

export const runtime = "edge";

// The caller's Web Push endpoints. POST upserts on `endpoint`; DELETE always
// answers 204, scoped to the caller server-side.
export async function POST(request: NextRequest) {
  return proxyToBackend(request, "/api/me/push-subscriptions");
}

export async function DELETE(request: NextRequest) {
  return proxyToBackend(request, "/api/me/push-subscriptions");
}
