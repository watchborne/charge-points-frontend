import { NextRequest } from "next/server";

import { proxyFileToBackend } from "@/lib/proxy-request";

// Edge runtime avoids Node.js serverless cold starts on this proxy hop.
export const runtime = "edge";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyFileToBackend(request, `/api/sites/${id}/report.pdf`);
}
