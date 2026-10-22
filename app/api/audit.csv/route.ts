import { NextRequest } from "next/server";

import { proxyToBackend } from "@/lib/proxy-request";

// Edge runtime avoids Node.js serverless cold starts on this proxy hop.
export const runtime = "edge";

export async function GET(request: NextRequest) {
  // raw: true — the backend answers text/csv with a Content-Disposition
  // attachment header, not JSON; proxyToBackend must pass both through
  // rather than forcing application/json.
  return proxyToBackend(request, "/api/audit.csv", { raw: true });
}
