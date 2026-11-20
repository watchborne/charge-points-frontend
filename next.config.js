const { withSentryConfig } = require("@sentry/nextjs/config");
const createNextIntlPlugin = require("next-intl/plugin");

const { buildContentSecurityPolicy } = require("./config/content-security-policy");

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

// Mirrors the fallbacks in lib/constants.ts — duplicated here because
// next.config.js runs as plain CommonJS, outside the TypeScript build, so it
// can't import that module directly.
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3000/ws";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

// Release version shown in the footer: the short commit SHA, which is what
// release.yml names the release/tag after (no semver, see that workflow). The
// deploy checks out the release tag, so the local git HEAD is the released
// commit; CI env vars are only a fallback (e.g. a build with no .git).
function releaseVersion() {
  let sha = "";
  try {
    sha = require("child_process")
      .execSync("git rev-parse HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString();
  } catch {
    sha = process.env.COMMIT_REF || process.env.GITHUB_SHA || "";
  }
  return sha.trim().slice(0, 7);
}

const contentSecurityPolicy = buildContentSecurityPolicy({
  apiUrl: API_URL,
  wsUrl: WS_URL,
  supabaseUrl: SUPABASE_URL,
  sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "",
});

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    // Report-only: violations are reported (to Sentry, when a DSN is set) but
    // nothing is blocked. Switch to the enforcing `Content-Security-Policy`
    // header once the reports show no legitimate request is violating it.
    key: "Content-Security-Policy-Report-Only",
    value: contentSecurityPolicy,
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Inlined at build time (see APP_VERSION in lib/constants.ts).
  env: { NEXT_PUBLIC_APP_VERSION: releaseVersion() },
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
