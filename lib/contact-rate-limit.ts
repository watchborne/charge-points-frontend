import { createRateLimiter } from "./rate-limit";

const toPositiveInt = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

// /api/contact spends a paid email quota and fills an inbox, so it is capped
// per client address — like charge-points-server's /api/access-requests bucket
// (ACCESS_REQUEST_RATE_LIMIT_*). Defaults: 5 requests / 60s. Kept out of
// route.ts, which Next only allows to export HTTP handlers.
export const contactRateLimiter = createRateLimiter({
  max: toPositiveInt(process.env.CONTACT_RATE_LIMIT_MAX, 5),
  windowMs: toPositiveInt(process.env.CONTACT_RATE_LIMIT_WINDOW_MS, 60_000),
});
