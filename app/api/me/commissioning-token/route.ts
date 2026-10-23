import { NextRequest } from "next/server";

import { proxyToBackend } from "@/lib/proxy-request";

export const runtime = "edge";

// The caller's commissioning token, used to claim the charge points that
// connect with it.
export async function GET(request: NextRequest) {
  return proxyToBackend(request, "/api/me/commissioning-token");
}

export async function POST(request: NextRequest) {
  return proxyToBackend(request, "/api/me/commissioning-token");
}

// Revokes the token without a new one: claimed stations stay claimed.
export async function DELETE(request: NextRequest) {
  return proxyToBackend(request, "/api/me/commissioning-token");
}
