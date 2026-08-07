import * as Sentry from "@sentry/nextjs";

// Reporting Web Vitals (LCP, CLS, INP, FCP, TTFB) is automatic once
// performance tracing is enabled here — Sentry's browser tracing
// integration attaches them to the pageload transaction, no manual
// useReportWebVitals wiring needed.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
  // Fraction of pageloads/navigations traced for performance data (which is
  // what carries Web Vitals). Tune down if ingest volume/cost becomes a
  // concern at higher traffic.
  tracesSampleRate: 1.0,
});

// Required so client-side route changes (App Router navigations, not just
// the initial page load) get their own traced transaction — without this,
// only the first pageload is instrumented.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
