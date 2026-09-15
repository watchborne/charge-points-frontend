import { NextRequest } from "next/server";

import { proxyToBackend } from "@/lib/proxy-request";

// Edge runtime avoids Node.js serverless cold starts on this proxy hop.
export const runtime = "edge";

// The backend takes no request body — it reads the acknowledging user from the
// forwarded session, never from the client — so there is nothing to shape here
// beyond the hop itself.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; alertId: string }> },
) {
  const { id, alertId } = await params;
  return proxyToBackend(request, `/api/charge-points/${id}/alerts/${alertId}/acknowledge`);
}
