import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

import { API_URL } from "./constants";

export async function proxyToBackend(
  request: NextRequest,
  backendPath: string,
): Promise<NextResponse> {
  const backendUrl = new URL(`${API_URL}${backendPath}`);

  request.nextUrl.searchParams.forEach((value, key) => {
    backendUrl.searchParams.set(key, value);
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

  // TEMPORARY DIAGNOSTIC — investigating a production 401 on scoped backend
  // routes (e.g. /api/ws-token): getSession() sometimes returns no session in
  // this route handler even though proxy.ts's middleware (a separate
  // Supabase client, via getUser()) already let the request through. Surfaced
  // as response headers (not logs, which turned out hard to locate) — visible
  // directly in the browser's Network tab. Never carries cookie/token values.
  // Remove once resolved.
  const cookieStore = await cookies();
  const sbCookieNames = cookieStore
    .getAll()
    .map((c) => c.name)
    .filter((name) => name.startsWith("sb-"));
  const debugHeaders: Record<string, string> = {
    "x-debug-had-session": session?.access_token ? "1" : "0",
    "x-debug-sb-cookie-count": String(sbCookieNames.length),
    "x-debug-sb-cookie-names": sbCookieNames.join(","),
  };

  const init: RequestInit = { method: request.method, headers };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.text();
  }

  const backendResponse = await fetch(backendUrl.toString(), init);
  const body = await backendResponse.text();

  return new NextResponse(body, {
    status: backendResponse.status,
    headers: { "Content-Type": "application/json", ...debugHeaders },
  });
}
