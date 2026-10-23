import { NextRequest } from "next/server";

import { proxyToBackend } from "@/lib/proxy-request";

export const runtime = "edge";

// Mints a single-use dashboard WebSocket token, server-side so the API key
// stays out of the browser.
export async function GET(request: NextRequest) {
  return proxyToBackend(request, "/api/ws-token");
}
