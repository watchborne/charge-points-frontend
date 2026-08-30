import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";

import { defaultLocale, localizedPath, locales, type Locale } from "@/i18n/locale";
import { routing } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/middleware";

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

// supabase-js's getUser() swallows expected auth errors (expired session,
// missing token, ...) but rethrows anything else — in particular a raw
// network failure talking to Supabase's API (see @supabase/auth-js's
// GoTrueClient#_getUser). Left uncaught here, that exception crashes the
// whole Netlify Edge Function for the request ("edge function invocation
// failed"), taking down /login, /signup or /app with it. Fail closed
// instead: treat it as no session, same as an expired/missing one.
async function getSessionUser(supabase: ReturnType<typeof createClient>["supabase"]) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error("proxy: supabase.auth.getUser() failed", error);
    return null;
  }
}

/**
 * Global proxy (Next's renamed `middleware.ts` file convention as of Next 16
 * — https://nextjs.org/docs/messages/middleware-to-proxy; `lib/supabase/middleware.ts`
 * is unrelated to that rename): redirects the retired `.fr` host, resolves
 * the URL's locale prefix via next-intl, and gates the authenticated
 * surface — refreshing the Supabase session as it does so.
 *
 * The Supabase session lookup (`getUser()`, a network round-trip) only runs
 * for the authenticated *page* surface (`/app`, `/login`, `/signup`); public
 * marketing pages skip it entirely, and so does `/api/*` — see below.
 *
 * `/api/*` is deliberately **not** gated here. `getUser()` revalidates the
 * token against Supabase Auth on every call, which measured at ~400–530 ms
 * per request, to reach a verdict the backend reaches again immediately
 * afterwards: it verifies the same JWT, resolves the caller's `AccessScope`
 * from it and fails closed with 401 when there is none (charge-points-server
 * ADR 0002). One authority, not two — the backend is the one that owns the
 * data, so it is the one that decides. `lib/proxy-request.ts` forwards
 * whatever session the request carries; an unauthenticated call reaches the
 * backend without an `Authorization` header and comes back 401 (issue #349).
 * The page gates below are untouched, so an unauthenticated visitor still
 * cannot reach the dashboard UI in the first place.
 *
 * - `watch-borne.fr` redirects (308) to `watch-borne.com` first — see `redirectFrHostToCom`.
 * - `/api/*`/`/auth/*` sit outside `[locale]` (no prefix): they skip
 *   next-intl's routing and pass through untouched (`/auth/*` handles its own
 *   redirects — see app/auth/callback/route.ts).
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
    return NextResponse.next({ request });
  }

  const intlResponse = handleI18nRouting(request);
  if (isRedirect(intlResponse)) return intlResponse;

  const { locale, rest } = stripLocalePrefix(pathname);
  const needsAuth = rest.startsWith("/app") || rest === "/login" || rest === "/signup";
  if (!needsAuth) return intlResponse;

  const { supabase, supabaseResponse } = createClient(request);
  const user = await getSessionUser(supabase);

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
