import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/proxy-request";

export async function GET(request: NextRequest) {
  return proxyToBackend(request, "/api/charge-points");
}

export async function POST(request: NextRequest) {
  return proxyToBackend(request, "/api/charge-points");
}
