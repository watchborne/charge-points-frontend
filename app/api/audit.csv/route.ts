import { NextRequest } from "next/server";

import { proxyToBackend } from "@/lib/proxy-request";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  // raw: pass the text/csv body and Content-Disposition through.
  return proxyToBackend(request, "/api/audit.csv", { raw: true });
}
