import * as Sentry from "@sentry/nextjs";

import { parseTracesSampleRate } from "./lib/sentry-sample-rate";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
  tracesSampleRate: parseTracesSampleRate(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE),
});
