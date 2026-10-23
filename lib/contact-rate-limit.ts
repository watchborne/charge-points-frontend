import { createRateLimiter } from "./rate-limit";

const toPositiveInt = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

// /api/contact spends a paid email quota, so it is capped per client address
// (default 5 / 60s). Kept out of route.ts, which may only export handlers.
export const contactRateLimiter = createRateLimiter({
  max: toPositiveInt(process.env.CONTACT_RATE_LIMIT_MAX, 5),
  windowMs: toPositiveInt(process.env.CONTACT_RATE_LIMIT_WINDOW_MS, 60_000),
});
