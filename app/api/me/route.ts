import { NextRequest } from "next/server";

import { proxyToBackend } from "@/lib/proxy-request";

// Proxies to the backend's GET /api/me: the caller's identity and the
// customers their AccessScope grants them access to (ADR 0002 in
// charge-points-server).
export async function GET(request: NextRequest) {
  return proxyToBackend(request, "/api/me");
}
