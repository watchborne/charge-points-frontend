/**
 * A minimal fixed-window, in-memory rate limiter for the few public routes
 * this app handles itself (`/api/contact`) rather than proxying to the
 * backend's own limiter (`charge-points-server`'s `@fastify/rate-limit`).
 *
 * State lives in the module, so it is per server instance: on a serverless
 * deployment each warm instance keeps its own counters. That still stops a
 * scripted loop hammering one instance, which is what it is for; it is not a
 * global quota.
 */

type Bucket = { count: number; resetAt: number };

export type RateLimitOptions = {
  max: number;
  windowMs: number;
};

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSeconds: number };

export const createRateLimiter = ({ max, windowMs }: RateLimitOptions) => {
  const buckets = new Map<string, Bucket>();

  const sweep = (now: number) => {
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  };

  return {
    check: (key: string, now: number = Date.now()): RateLimitResult => {
      // Expired buckets would otherwise accumulate one entry per distinct
      // client for the life of the instance.
      sweep(now);

      const bucket = buckets.get(key);
      if (!bucket) {
        buckets.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true };
      }
      if (bucket.count >= max) {
        return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
      }
      bucket.count += 1;
      return { allowed: true };
    },
    reset: () => buckets.clear(),
  };
};

/**
 * The caller's address as the hosting edge reports it. Netlify sets
 * `x-nf-client-connection-ip` itself (a client-supplied value is overwritten);
 * `x-forwarded-for` is the fallback for other hosts and local dev.
 */
export const getClientIp = (headers: Headers): string =>
  headers.get("x-nf-client-connection-ip") ??
  headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
  "unknown";
