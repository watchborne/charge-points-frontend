import { NextRequest } from "next/server";

import { proxyToBackend } from "@/lib/proxy-request";

// Edge runtime avoids Node.js serverless cold starts on this proxy hop.
export const runtime = "edge";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToBackend(request, `/api/charge-points/${id}/availability`);
}
