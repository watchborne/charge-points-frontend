import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";

import { defaultLocale, localizedPath, locales, type Locale } from "@/i18n/locale";
import { routing } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/middleware";

// The retired .fr domain redirects permanently to .com (unprefixed = fr).
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

// /api/* and /auth/* are outside the `[locale]` segment.
function isLocaleRoutedPath(pathname: string) {
  return !pathname.startsWith("/api") && !pathname.startsWith("/auth");
}

// A next-intl redirect only normalizes the URL: return it before the auth
// check, which applies to the follow-up request.
function isRedirect(response: NextResponse) {
  return response.headers.has("location");
}

// "/en/app/dashboard" -> { locale: "en", rest: "/app/dashboard" }; an
// unprefixed path is fr.
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

// getUser() rethrows non-auth errors such as a network failure, which would
// crash the edge function and take down /login, /signup or /app. Fail closed:
// treat it as no session.
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
 * Global proxy (Next 16's name for middleware): redirects the retired `.fr`
 * host, resolves the locale prefix via next-intl, and gates the authenticated
 * pages while refreshing the Supabase session.
 *
 * The session lookup (`getUser()`, a network round trip) runs only for
 * `/app`, `/login` and `/signup`. `/api/*` is not gated here: the backend
 * verifies the forwarded token and answers 401 itself, so a second check would
 * only add ~400–530 ms per request.
 *
 * - `/api/*` and `/auth/*` (no locale prefix) skip next-intl and pass through.
 * - Everything else goes through `handleI18nRouting`; its redirects return
 *   immediately, then `/app/*`, `/login` and `/signup` are gated, redirect
 *   targets re-prefixed via `localizedPath`.
 *
 * Any response returned instead of `supabaseResponse` must carry its refreshed
 * cookies, or a token rotated during `getUser()` is lost.
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

// Excludes static files from public/ (sw.js, manifest.json, icons…):
// next-intl would otherwise rewrite them as locale pages and serve a 404 page.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
