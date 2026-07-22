import { NextResponse, type NextRequest } from "next/server";

import { isLocale, LOCALE_COOKIE_NAME, LOCALE_QUERY_PARAM, localeForHost } from "@/i18n/locale";
import { createClient } from "@/lib/supabase/middleware";

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
 * Resolves the active locale for this request: an explicit `?lang=` query
 * param always wins (so a shared link or the footer switcher can force a
 * locale), then the persisted `NEXT_LOCALE` cookie, then a first-time
 * visitor's host TLD (`localeForHost`: `.fr` -> fr, `.com` -> en, else the
 * default locale).
 */
function resolveLocale(request: NextRequest) {
  const queryLocale = request.nextUrl.searchParams.get(LOCALE_QUERY_PARAM);
  if (isLocale(queryLocale)) return queryLocale;

  const cookieLocale = request.cookies.get(LOCALE_COOKIE_NAME)?.value;
  if (isLocale(cookieLocale)) return cookieLocale;

  return localeForHost(request.headers.get("host") ?? "");
}

/**
 * Global middleware: resolves the locale for every matched request, rewrites
 * requests on the app.* subdomain into the /app route tree, and gates access to
 * the authenticated surface — refreshing the Supabase session as it does so.
 *
 * The Supabase session lookup (`getUser()`, a network round-trip) runs only for
 * the authenticated surface (`/api`, `/app`, `/login`, `/signup`); public
 * marketing pages skip it and just get locale + any app-host rewrite.
 *
 * - The locale comes from `resolveLocale` (see above). It's set on the
 *   request's cookies too (not just the response) so this request's RSC
 *   render picks it up immediately via `i18n/request.ts` — a cookie on the
 *   response alone only applies from the next request onward. The response
 *   cookie is refreshed on every request so a `?lang=` switch (or a
 *   first-visit host guess) persists.
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
  const locale = resolveLocale(request);
  // Set on the request too (not just the response) so the current request's
  // RSC render picks it up immediately via `i18n/request.ts` — the cookie
  // header on a downstream response alone would only apply from the next
  // request onward.
  request.cookies.set(LOCALE_COOKIE_NAME, locale);

  const rewrittenUrl = rewriteToAppTree(request);
  const pathname = rewrittenUrl ? rewrittenUrl.pathname : request.nextUrl.pathname;

  const setLocaleCookie = (response: NextResponse) => {
    response.cookies.set(LOCALE_COOKIE_NAME, locale, {
      path: "/",
      maxAge: LOCALE_COOKIE_MAX_AGE,
    });
    return response;
  };

  // Only the authenticated surface needs a Supabase session lookup. Public
  // marketing pages skip `supabase.auth.getUser()` — a network round-trip to
  // Supabase that ran on *every* request, marketing pages included. They still
  // get locale resolution and, on an app.* host, the /app rewrite.
  const needsAuth =
    pathname.startsWith("/api") ||
    pathname.startsWith("/app") ||
    pathname === "/login" ||
    pathname === "/signup";

  if (!needsAuth) {
    const response = rewrittenUrl
      ? NextResponse.rewrite(rewrittenUrl, { request })
      : NextResponse.next({ request });
    return setLocaleCookie(response);
  }

  const { supabase, supabaseResponse } = createClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const withSessionCookies = (response: NextResponse) => {
    supabaseResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
    return setLocaleCookie(response);
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
    return withSessionCookies(NextResponse.rewrite(rewrittenUrl, { request }));
  }

  return withSessionCookies(supabaseResponse);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
