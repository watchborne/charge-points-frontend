import { NextResponse, type NextRequest } from "next/server";

import { localeForHost } from "@/i18n/locale";
import { createClient } from "@/lib/supabase/middleware";

const LOCALE_COOKIE = "NEXT_LOCALE";
const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

// Hosts that serve the authenticated dashboard at the bare path (e.g.
// app.watch-borne.com/dashboard) instead of the /app-prefixed path used
// everywhere else (e.g. watch-borne.com/app/dashboard, or localhost:3001/app/dashboard
// in local dev — there is no subdomain routing locally, so this list is prod-only).
const APP_HOSTS = ["app.watch-borne.com", "app.watchborne.netlify.app"];

// Routes that must stay reachable unprefixed even on an APP_HOSTS request: API routes,
// the login page, and the auth callback all live outside app/app/, so prefixing them
// with /app would 404.
const APP_REWRITE_EXCLUDED_PREFIXES = ["/app", "/api", "/login", "/signup", "/auth"];

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
 * derives the locale from the request host, rewrites requests on the app.*
 * subdomain into the /app route tree, and gates access to the authenticated
 * surface.
 *
 * - If the request has no `NEXT_LOCALE` cookie yet, one is set from the host's
 *   TLD (`localeForHost` in `i18n/locale.ts`: `.fr` -> fr, `.com` -> en, else
 *   the default locale) so first-time visitors get the right language. An
 *   existing cookie (e.g. set by a future manual language switcher) is never
 *   overridden.
 * - On an app.* host, a bare path like `/dashboard` is served from `/app/dashboard`
 *   (see `APP_HOSTS` / `rewriteToAppTree`). `/api`, `/login`, and `/auth` are never
 *   rewritten since they don't live under `app/app/`.
 * - `/app/*` (after any rewrite) — requires a session; unauthenticated users are
 *   redirected to `/login`.
 * - `/api/*` — requires a session; unauthenticated callers get 401. These routes
 *   proxy to the backend with the shared API key (`lib/proxy-request.ts`), so they
 *   must never be reachable without a user session.
 * - `/login` and `/signup` — authenticated users are bounced to the dashboard.
 *
 * Any response we return in place of `supabaseResponse` must carry the refreshed
 * session cookies, otherwise a token rotated during `getUser()` is lost.
 */
export async function middleware(request: NextRequest) {
  const hasLocaleCookie = request.cookies.has(LOCALE_COOKIE);
  if (!hasLocaleCookie) {
    // Set on the request too (not just the response) so the current request's
    // RSC render picks it up immediately via `i18n/request.ts` — the cookie
    // header on a downstream response alone would only apply from the next
    // request onward.
    request.cookies.set(LOCALE_COOKIE, localeForHost(request.headers.get("host") ?? ""));
  }

  const { supabase, supabaseResponse } = createClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!hasLocaleCookie) {
    supabaseResponse.cookies.set(LOCALE_COOKIE, localeForHost(request.headers.get("host") ?? ""), {
      path: "/",
      maxAge: LOCALE_COOKIE_MAX_AGE,
    });
  }

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

  if ((pathname === "/login" || pathname === "/signup") && user) {
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
