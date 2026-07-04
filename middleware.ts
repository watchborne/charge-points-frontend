import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/middleware";

// Hosts that serve the authenticated dashboard at the bare path (e.g.
// app.watch-borne.com/dashboard) instead of the /app-prefixed path used
// everywhere else (e.g. watch-borne.com/app/dashboard, or localhost:3001/app/dashboard
// in local dev — there is no subdomain routing locally, so this list is prod-only).
const APP_HOSTS = ["app.watch-borne.com", "app.watchborne.netlify.app"];

// Routes that must stay reachable unprefixed even on an APP_HOSTS request: API routes,
// the login page, and the auth callback all live outside app/app/, so prefixing them
// with /app would 404.
const APP_REWRITE_EXCLUDED_PREFIXES = ["/app", "/api", "/login", "/auth"];

function rewriteToAppTree(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const { pathname } = request.nextUrl;

  if (!APP_HOSTS.includes(host)) return null;
  if (APP_REWRITE_EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return null;

  const url = request.nextUrl.clone();
  url.pathname = `/app${pathname}`;
  return url;
}

/**
 * Global middleware: refreshes the Supabase session on every matched request,
 * rewrites requests on the app.* subdomain into the /app route tree, and gates
 * access to the authenticated surface.
 *
 * - On an app.* host, a bare path like `/dashboard` is served from `/app/dashboard`
 *   (see `APP_HOSTS` / `rewriteToAppTree`). `/api`, `/login`, and `/auth` are never
 *   rewritten since they don't live under `app/app/`.
 * - `/app/*` (after any rewrite) — requires a session; unauthenticated users are
 *   redirected to `/login`.
 * - `/api/*` — requires a session; unauthenticated callers get 401. These routes
 *   proxy to the backend with the shared API key (`lib/proxy-request.ts`), so they
 *   must never be reachable without a user session.
 * - `/login` — authenticated users are bounced to the dashboard.
 *
 * Any response we return in place of `supabaseResponse` must carry the refreshed
 * session cookies, otherwise a token rotated during `getUser()` is lost.
 */
export async function middleware(request: NextRequest) {
  const { supabase, supabaseResponse } = createClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rewrittenUrl = rewriteToAppTree(request);
  const pathname = rewrittenUrl ? rewrittenUrl.pathname : request.nextUrl.pathname;

  const withSessionCookies = (response: NextResponse) => {
    supabaseResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
    return response;
  };

  const redirectTo = (path: string) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    return withSessionCookies(NextResponse.redirect(url));
  };

  if (pathname.startsWith("/api")) {
    if (!user) {
      return withSessionCookies(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
    }
    return supabaseResponse;
  }

  if (pathname.startsWith("/app") && !user) {
    return redirectTo("/login");
  }

  if (pathname === "/login" && user) {
    return redirectTo("/app/dashboard");
  }

  if (rewrittenUrl) {
    return withSessionCookies(NextResponse.rewrite(rewrittenUrl));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
