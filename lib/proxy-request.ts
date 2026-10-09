import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

import { API_URL } from "./constants";

type BackendCall = { response: Response } | { failure: NextResponse };

/**
 * The part of the proxy every flavour shares: builds the backend request from
 * the incoming one (query string, `x-api-key`, the caller's bearer token) and
 * sends it. What differs between flavours is only what is done with the
 * response, so an unreachable backend is turned into the same 502 here for all.
 */
async function callBackend(request: NextRequest, backendPath: string): Promise<BackendCall> {
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
): Promise<NextResponse> {
  const call = await callBackend(request, backendPath);
  if ("failure" in call) return call.failure;

  const body = await call.response.text();

  return new NextResponse(body, {
    status: call.response.status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * `proxyToBackend` for an endpoint that answers with a file (a generated PDF)
 * rather than JSON: the body is streamed through untouched — reading it with
 * `.text()` would corrupt binary — and the headers a download needs
 * (`Content-Type`, `Content-Disposition`) come from the backend, which owns the
 * file's type and name. Never cacheable: a generated file is a snapshot of
 * private data. A backend error (404, 401) keeps its own JSON content type, so
 * the client reads it like any other failed call.
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
