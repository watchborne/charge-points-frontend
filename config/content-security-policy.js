// Plain CommonJS: `next.config.js` runs outside the TypeScript build, so it
// cannot import from `lib/`.

/** The origin of a URL, or `null` when it is empty or not a URL. */
function originOf(url) {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/**
 * Where a Sentry DSN (`https://<key>@<host>/<projectId>`) receives events and
 * CSP violation reports, or `null` when it is unset or malformed.
 */
function sentryEndpoints(dsn) {
  try {
    const { protocol, username, host, pathname } = new URL(dsn);
    const projectId = pathname.replace(/^\/+/, "");
    if (!username || !projectId) return null;
    const origin = `${protocol}//${host}`;
    return {
      origin,
      reportUri: `${origin}/api/${projectId}/security/?sentry_key=${username}`,
    };
  } catch {
    return null;
  }
}

/**
 * The page's Content-Security-Policy.
 *
 * `connect-src` lists the origins the browser itself talks to: the dashboard's
 * WebSocket, the Supabase Auth client and Sentry's ingest. `apiUrl` is only
 * called server-side (the browser goes through same-origin `/api/*` routes) and
 * is listed in case that changes.
 *
 * With a Sentry DSN, violations are reported to Sentry's security endpoint
 * (`report-uri`), which is what tells whether the policy can be enforced
 * without blocking a legitimate request.
 */
function buildContentSecurityPolicy({ apiUrl, wsUrl, supabaseUrl, sentryDsn }) {
  const sentry = sentryEndpoints(sentryDsn);

  const connectSrcOrigins = [
    "'self'",
    originOf(apiUrl),
    originOf(wsUrl),
    originOf(supabaseUrl),
    sentry && sentry.origin,
  ].filter(Boolean);

  return [
    `default-src 'self'`,
    `script-src 'self' 'unsafe-inline'`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data:`,
    `font-src 'self' data:`,
    `connect-src ${[...new Set(connectSrcOrigins)].join(" ")}`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `upgrade-insecure-requests`,
    ...(sentry ? [`report-uri ${sentry.reportUri}`] : []),
  ].join("; ");
}

module.exports = { buildContentSecurityPolicy, sentryEndpoints };
