import { NextRequest } from "next/server";

import { proxyToBackend } from "@/lib/proxy-request";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToBackend(request, `/api/charge-points/${id}/trigger`);
}
