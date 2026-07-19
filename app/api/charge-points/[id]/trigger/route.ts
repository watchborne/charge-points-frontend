import { NextRequest } from "next/server";

import { proxyToBackend } from "@/lib/proxy-request";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return proxyToBackend(request, `/api/charge-points/${params.id}/trigger`);
}
