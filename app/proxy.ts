import { NextRequest, NextResponse } from "next/server";

export const urls = {
  marketing: [
    "http://localhost:3000", // Local
    "https://watchborne.netlify.app", // Prod - Without Domain name
    "https://watch-borne.com", // Prod - With Domain name
  ],
  app: [
    "http://localhost:3000/app", // Local
    "https://app.watchborne.netlify.app", // Prod - Without Domain name
    "https://app.watch-borne.com", // Prod - With Domain name
  ],
};

export function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const url = request.nextUrl.clone();

  if (urls.app.includes(host) && !url.pathname.startsWith("/app")) {
    url.pathname = `/app${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}
