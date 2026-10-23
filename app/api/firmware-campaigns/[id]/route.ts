import { NextRequest } from "next/server";

import { proxyToBackend } from "@/lib/proxy-request";

export const runtime = "edge";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToBackend(request, `/api/firmware-campaigns/${id}`);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyToBackend(request, `/api/firmware-campaigns/${id}`);
}
