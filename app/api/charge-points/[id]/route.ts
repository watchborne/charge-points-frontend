import { NextRequest } from "next/server";

import { proxyToBackend } from "@/lib/proxy-request";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return proxyToBackend(request, `/api/charge-points/${params.id}`);
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  return proxyToBackend(request, `/api/charge-points/${params.id}`);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return proxyToBackend(request, `/api/charge-points/${params.id}`);
}
