import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/middleware";

/**
 * Global middleware: refreshes the Supabase session on every matched request and
 * gates access to the authenticated surface.
 *
 * - `/app/*` — requires a session; unauthenticated users are redirected to `/login`.
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

  const { pathname } = request.nextUrl;

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

  return supabaseResponse;
}

export const config = {
  matcher: ["/app/:path*", "/api/:path*", "/login"],
};
