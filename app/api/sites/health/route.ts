import { NextRequest } from "next/server";

import { proxyToBackend } from "@/lib/proxy-request";

// Edge runtime avoids Node.js serverless cold starts on this proxy hop.
export const runtime = "edge";

export async function GET(request: NextRequest) {
  return proxyToBackend(request, "/api/sites/health");
}
