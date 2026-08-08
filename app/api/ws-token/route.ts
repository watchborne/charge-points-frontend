import { NextRequest } from "next/server";

import { proxyToBackend } from "@/lib/proxy-request";

// Edge runtime avoids Node.js serverless cold starts on this proxy hop.
export const runtime = "edge";

// Mints a single-use dashboard WebSocket token. Proxies to the backend
// `/api/ws-token` route server-side so the shared API key stays out of the
// browser bundle.
export async function GET(request: NextRequest) {
  return proxyToBackend(request, "/api/ws-token");
}
