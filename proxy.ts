import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";

import { defaultLocale, localizedPath, locales, type Locale } from "@/i18n/locale";
import { routing } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/middleware";

// API routes reachable without a Supabase session. The alpha access request is
// submitted from /signup by an unauthenticated visitor, so its proxy route must
// not be gated behind a session (it still forwards the shared API key to the
// backend server-side). check-login is the same story from /login: LoginForm
// calls it to decide whether the visitor may even attempt to sign in, so it
// must be reachable before any session exists (charge-points-server ADR 0006).
const PUBLIC_API_PATHS = ["/api/access-requests", "/api/access-requests/check-login"];

// The .fr domain is retired in favor of .com; visitors are redirected there
// permanently. Unlike before URL-based locale routing, no `?lang=` is needed
// any more: an unprefixed path on .com already means fr, the default locale.
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

// /api/* and /auth/* live outside the `[locale]` segment (no locale prefix —
// see i18n/routing.ts) — next-intl's routing has nothing to do there.
function isLocaleRoutedPath(pathname: string) {
  return !pathname.startsWith("/api") && !pathname.startsWith("/auth");
}

// A redirect from next-intl only normalizes the URL (missing/extra locale
// prefix) — no page content is served, so it's always safe to return
// immediately without checking auth. The browser refetches with the
// corrected URL, and auth gating below applies on that follow-up request.
function isRedirect(response: NextResponse) {
  return response.headers.has("location");
}

// Splits a locale-routed pathname into the active locale and the path with
// its prefix removed, e.g. "/en/app/dashboard" -> { locale: "en", rest:
// "/app/dashboard" }, "/app/dashboard" -> { locale: "fr", rest: "/app/dashboard" }
// (fr is the default locale and stays unprefixed).
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
 * Global proxy (Next's renamed `middleware.ts` file convention as of Next 16 —
 * see https://nextjs.org/docs/messages/middleware-to-proxy; the helper this
 * calls into is still `lib/supabase/middleware.ts`, unrelated to the file
 * convention rename): redirects the retired `.fr` host, resolves the URL's
 * locale prefix via next-intl, and gates access to the authenticated
 * surface — refreshing the Supabase session as it does so.
 *
 * The Supabase session lookup (`getUser()`, a network round-trip) runs only for
 * the authenticated surface (`/api`, `/app`, `/login`, `/signup`); public
 * marketing pages skip it entirely.
 *
 * - `watch-borne.fr` is redirected (308) to `watch-borne.com` — see
 *   `redirectFrHostToCom`. This runs before anything else below.
 * - `/api/*` and `/auth/*` sit outside the `[locale]` segment (no locale
 *   prefix), so they skip next-intl's routing and go straight to the
 *   Supabase gate (for `/api/*`) or through untouched (for `/auth/*`, which
 *   handles its own redirects — see app/auth/callback/route.ts).
 * - Everything else goes through `handleI18nRouting` first. A redirect from
 *   that (URL normalization) is returned immediately — see `isRedirect`.
 *   Otherwise, `/app/*`, `/login`, `/signup` (locale prefix stripped) are
 *   gated the same way as before, with redirect targets re-prefixed with the
 *   request's locale via `localizedPath`.
 *
 * Any response we return in place of `supabaseResponse` must carry the
 * refreshed session cookies, otherwise a token rotated during `getUser()` is
 * lost.
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
