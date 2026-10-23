import { NextRequest } from "next/server";

import { proxyToBackend } from "@/lib/proxy-request";

export const runtime = "edge";

// No body: the backend takes the user from the forwarded session.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; alertId: string }> },
) {
  const { id, alertId } = await params;
  return proxyToBackend(request, `/api/charge-points/${id}/alerts/${alertId}/acknowledge`);
}
