import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

import { API_URL } from "./constants";

export async function proxyToBackend(
  request: NextRequest,
  backendPath: string,
): Promise<NextResponse> {
  const backendUrl = new URL(`${API_URL}${backendPath}`);

  // `append`, not `set`: a repeated parameter must survive the hop. The metering
  // reads take `?measurand=Voltage&measurand=SoC` to ask for two series at once,
  // and `set` would keep only the last one — a filter silently narrowing on its
  // way to the backend. Appending is equivalent for single-valued params because
  // `backendUrl` starts with no query of its own (it is API_URL + a fixed path).
  request.nextUrl.searchParams.forEach((value, key) => {
    backendUrl.searchParams.append(key, value);
  });

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const apiKey = process.env.API_SECRET_KEY;
  if (apiKey) {
    headers["x-api-key"] = apiKey;
  }

  // Forwards the signed-in caller's Supabase access token so the backend can
  // resolve their per-user AccessScope (ADR 0002 in charge-points-server —
  // multi-tenant access control). middleware.ts already guarantees a session
  // exists for every /api/* request; the optional chaining just avoids a
  // crash on the theoretical race of a token expiring between the two.
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  const init: RequestInit = { method: request.method, headers };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.text();
  }

  const backendResponse = await fetch(backendUrl.toString(), init);
  const body = await backendResponse.text();

  return new NextResponse(body, {
    status: backendResponse.status,
    headers: { "Content-Type": "application/json" },
  });
}
