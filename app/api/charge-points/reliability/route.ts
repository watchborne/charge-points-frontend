import { NextRequest } from "next/server";

import { proxyToBackend } from "@/lib/proxy-request";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  return proxyToBackend(request, "/api/charge-points/reliability");
}
