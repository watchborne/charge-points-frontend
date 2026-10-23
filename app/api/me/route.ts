import { NextRequest } from "next/server";

import { proxyToBackend } from "@/lib/proxy-request";

export const runtime = "edge";

// The caller's identity and the charge points their AccessScope grants.
export async function GET(request: NextRequest) {
  return proxyToBackend(request, "/api/me");
}
