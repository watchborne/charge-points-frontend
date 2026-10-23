import { NextRequest } from "next/server";

import { proxyToBackend } from "@/lib/proxy-request";

export const runtime = "edge";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> },
) {
  const { id, messageId } = await params;
  return proxyToBackend(request, `/api/charge-points/${id}/display-messages/${messageId}`);
}
