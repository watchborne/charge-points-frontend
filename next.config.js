const { withSentryConfig } = require("@sentry/nextjs");
const createNextIntlPlugin = require("next-intl/plugin");

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

// Mirrors the fallbacks in lib/constants.ts — duplicated here because
// next.config.js runs as plain CommonJS, outside the TypeScript build, so it
// can't import that module directly.
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3000/ws";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

function originOf(url) {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

// Origins the browser actually talks to: the dashboard's direct WebSocket
// connection (app/app/ws/ws-manager.ts) and the Supabase Auth browser client
// (lib/supabase/client.ts). API_URL is only ever called server-side (the
// browser goes through same-origin /api/* proxy routes, lib/proxy-request.ts)
// but its origin is included defensively in case that ever changes.
const connectSrcOrigins = ["'self'", API_URL, WS_URL, SUPABASE_URL]
  .map((url) => (url === "'self'" ? url : originOf(url)))
  .filter(Boolean);

const contentSecurityPolicy = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline'`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data:`,
  `font-src 'self' data:`,
  `connect-src ${connectSrcOrigins.join(" ")}`,
  `frame-ancestors 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `upgrade-insecure-requests`,
].join("; ");

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    // Report-only for now: verify no legitimate request is blocked before
    // switching this to the enforcing `Content-Security-Policy` header (see #184).
    key: "Content-Security-Policy-Report-Only",
    value: contentSecurityPolicy,
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = withSentryConfig(withNextIntl(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Source maps only upload when org/project/authToken are set (CI only);
  // absent locally and in PR builds, this step is silently skipped.
  silent: true,
  widenClientFileUpload: true,
  webpack: {
    treeshake: { removeDebugLogging: true },
  },
});
