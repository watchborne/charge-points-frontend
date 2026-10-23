import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

import { API_URL } from "./constants";

// Statuses the Fetch spec forbids a body on, even an empty string.
const NULL_BODY_STATUSES = new Set([101, 204, 205, 304]);

type BackendCall = { response: Response } | { failure: NextResponse };

/**
 * Builds and sends the backend request (query string, `x-api-key`, the
 * caller's bearer token). An unreachable backend becomes a 502.
 */
async function callBackend(request: NextRequest, backendPath: string): Promise<BackendCall> {
  const backendUrl = new URL(`${API_URL}${backendPath}`);

  // `append`, not `set`: a repeated parameter (`?measurand=A&measurand=B`)
  // must survive the hop.
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

  // Forwards the caller's Supabase access token, if any, so the backend can
  // resolve their AccessScope; without one, it answers 401 where required.
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

  try {
    return { response: await fetch(backendUrl.toString(), init) };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { area: "api-proxy" },
      extra: { backendUrl: backendUrl.toString(), method: request.method },
    });
    return {
      failure: new NextResponse(JSON.stringify({ error: "Backend unreachable" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }
}

export async function proxyToBackend(
  request: NextRequest,
  backendPath: string,
  options?: { raw?: boolean },
): Promise<NextResponse> {
  const call = await callBackend(request, backendPath);
  if ("failure" in call) return call.failure;

  const requestContentType = request.headers.get("Content-Type") ?? "application/json";

  // A null-body status must have no body: `new Response("", { status: 204 })`
  // throws.
  const body = NULL_BODY_STATUSES.has(call.response.status) ? null : await call.response.text();

  if (options?.raw) {
    const headers: Record<string, string> = {};
    const contentType = call.response.headers.get("content-type");
    if (contentType) headers["Content-Type"] = contentType;
    const contentDisposition = call.response.headers.get("content-disposition");
    if (contentDisposition) headers["Content-Disposition"] = contentDisposition;
    return new NextResponse(body, { status: call.response.status, headers });
  }

  return new NextResponse(body, {
    status: call.response.status,
    headers: { "Content-Type": requestContentType },
  });
}

/**
 * `proxyToBackend` for a file: the body is streamed untouched (`.text()`
 * would corrupt binary), with the backend's `Content-Type` and
 * `Content-Disposition`. Never cached. A backend error keeps its JSON.
 */
export async function proxyFileToBackend(
  request: NextRequest,
  backendPath: string,
): Promise<NextResponse> {
  const call = await callBackend(request, backendPath);
  if ("failure" in call) return call.failure;

  const { response } = call;
  const headers: Record<string, string> = {
    "Content-Type": response.headers.get("Content-Type") ?? "application/octet-stream",
    "Cache-Control": "private, no-store",
  };

  const disposition = response.headers.get("Content-Disposition");
  if (disposition) headers["Content-Disposition"] = disposition;

  return new NextResponse(response.body, { status: response.status, headers });
}
