import { NextRequest } from "next/server";

import { proxyToBackend } from "@/lib/proxy-request";

export const runtime = "edge";

// The caller's digest opt-in/out, send hour (Europe/Paris) and email language.
export async function GET(request: NextRequest) {
  return proxyToBackend(request, "/api/me/notification-preferences");
}

export async function PATCH(request: NextRequest) {
  return proxyToBackend(request, "/api/me/notification-preferences");
}
