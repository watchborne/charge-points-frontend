import { NextRequest } from "next/server";

import { proxyToBackend } from "@/lib/proxy-request";

export const runtime = "edge";

// Public: submitted from /signup without a session. The proxy still injects
// the API key.
export async function POST(request: NextRequest) {
  return proxyToBackend(request, "/api/access-requests");
}
