import { NextRequest } from "next/server";

import { proxyToBackend } from "@/lib/proxy-request";

// Edge runtime avoids Node.js serverless cold starts on this proxy hop.
export const runtime = "edge";

// Proxies to the backend's GET/POST /api/me/commissioning-token: the caller's
// personal commissioning token, used to auto-claim membership on a charge
// point they connect via the OCPP URL (ADR 0002 in charge-points-server).
export async function GET(request: NextRequest) {
  return proxyToBackend(request, "/api/me/commissioning-token");
}

export async function POST(request: NextRequest) {
  return proxyToBackend(request, "/api/me/commissioning-token");
}
