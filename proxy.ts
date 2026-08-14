import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";

import { defaultLocale, localizedPath, locales, type Locale } from "@/i18n/locale";
import { routing } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/middleware";

// API routes reachable without a Supabase session. access-requests is
// submitted from /signup by an unauthenticated visitor (still forwards the
// shared API key server-side). check-login is called by LoginForm to decide
// whether the visitor may even attempt to sign in — before any session
// exists (charge-points-server ADR 0006). verify-email is the confirmation
// link's destination — reachable before approval, let alone a session (ADR 0007).
const PUBLIC_API_PATHS = [
  "/api/access-requests",
  "/api/access-requests/check-login",
  "/api/access-requests/verify-email",
];

// The .fr domain is retired in favor of .com; visitors are redirected there
// permanently. No `?lang=` needed — an unprefixed path on .com already means
// fr, the default locale.
const FR_HOST = "watch-borne.fr";
const FR_REDIRECT_HOST = "watch-borne.com";

function redirectFrHostToCom(request: NextRequest) {
  if ((request.headers.get("host") ?? "") !== FR_HOST) return null;

  const url = request.nextUrl.clone();
  url.host = FR_REDIRECT_HOST;
  url.port = "";
  return url;
}

const handleI18nRouting = createIntlMiddleware(routing);

// /api/* and /auth/* live outside the `[locale]` segment (see i18n/routing.ts)
// — next-intl's routing has nothing to do there.
function isLocaleRoutedPath(pathname: string) {
  return !pathname.startsWith("/api") && !pathname.startsWith("/auth");
}

// A redirect from next-intl only normalizes the URL (missing/extra locale
// prefix), no page content served — safe to return immediately without
// checking auth. The browser refetches with the corrected URL, and auth
// gating applies on that follow-up request.
function isRedirect(response: NextResponse) {
  return response.headers.has("location");
}

// Splits a locale-routed pathname into the active locale and the unprefixed
// path, e.g. "/en/app/dashboard" -> { locale: "en", rest: "/app/dashboard" };
// "/app/dashboard" -> { locale: "fr", ... } (fr stays unprefixed as default).
function stripLocalePrefix(pathname: string): { locale: Locale; rest: string } {
  for (const locale of locales) {
    if (locale === defaultLocale) continue;
    const prefix = `/${locale}`;
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return { locale, rest: pathname.slice(prefix.length) || "/" };
    }
  }
  return { locale: defaultLocale, rest: pathname };
}

async function gateApiRequest(request: NextRequest) {
  const { supabase, supabaseResponse } = createClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    supabaseResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
    return response;
  }

  return supabaseResponse;
}

/**
 * Global proxy (Next's renamed `middleware.ts` file convention as of Next 16
 * — https://nextjs.org/docs/messages/middleware-to-proxy; `lib/supabase/middleware.ts`
 * is unrelated to that rename): redirects the retired `.fr` host, resolves
 * the URL's locale prefix via next-intl, and gates the authenticated
 * surface — refreshing the Supabase session as it does so.
 *
 * The Supabase session lookup (`getUser()`, a network round-trip) only runs
 * for the authenticated surface (`/api`, `/app`, `/login`, `/signup`);
 * public marketing pages skip it entirely.
 *
 * - `watch-borne.fr` redirects (308) to `watch-borne.com` first — see `redirectFrHostToCom`.
 * - `/api/*`/`/auth/*` sit outside `[locale]` (no prefix): they skip
 *   next-intl's routing, going straight to the Supabase gate (`/api/*`) or
 *   through untouched (`/auth/*`, which handles its own redirects — see
 *   app/auth/callback/route.ts).
 * - Everything else goes through `handleI18nRouting` first; a redirect from
 *   that (URL normalization) returns immediately (`isRedirect`). Otherwise
 *   `/app/*`, `/login`, `/signup` are gated as before, redirect targets
 *   re-prefixed via `localizedPath`.
 *
 * Any response returned in place of `supabaseResponse` must carry the
 * refreshed session cookies, or a token rotated during `getUser()` is lost.
 */
export async function proxy(request: NextRequest) {
  const frRedirectUrl = redirectFrHostToCom(request);
  if (frRedirectUrl) return NextResponse.redirect(frRedirectUrl, 308);

  const { pathname } = request.nextUrl;

  if (!isLocaleRoutedPath(pathname)) {
    if (pathname.startsWith("/api") && !PUBLIC_API_PATHS.includes(pathname)) {
      return gateApiRequest(request);
    }
    return NextResponse.next({ request });
  }

  const intlResponse = handleI18nRouting(request);
  if (isRedirect(intlResponse)) return intlResponse;

  const { locale, rest } = stripLocalePrefix(pathname);
  const needsAuth = rest.startsWith("/app") || rest === "/login" || rest === "/signup";
  if (!needsAuth) return intlResponse;

  const { supabase, supabaseResponse } = createClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const withSessionCookies = (response: NextResponse) => {
    supabaseResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
    return response;
  };

  const redirectTo = (path: string) => {
    const url = request.nextUrl.clone();
    url.pathname = localizedPath(path, locale);
    return withSessionCookies(NextResponse.redirect(url));
  };

  if (rest.startsWith("/app") && !user) {
    return redirectTo("/login");
  }

  if ((rest === "/login" || rest === "/signup") && user) {
    return redirectTo("/app/dashboard");
  }

  return withSessionCookies(intlResponse);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
