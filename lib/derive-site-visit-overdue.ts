import type { Site } from "@watchborne/charge-points-types";

/**
 * Client-side port of the backend's `findOverdueSites`, kept in lockstep
 * (same threshold and fallback), derived from `Site.lastVisitedAt` and
 * `installedAt`.
 */
export const OVERDUE_VISIT_AFTER_DAYS = 90;

/**
 * Not visited within `OVERDUE_VISIT_AFTER_DAYS`, `installedAt` standing in
 * for a site never visited. Exactly the threshold is not yet overdue.
 */
export const isSiteVisitOverdue = (site: Site, now: Date = new Date()): boolean => {
  const lastActivity = site.lastVisitedAt
    ? new Date(site.lastVisitedAt)
    : new Date(site.installedAt);
  const daysSinceLastActivity = (now.getTime() - lastActivity.getTime()) / (24 * 60 * 60 * 1000);

  return daysSinceLastActivity > OVERDUE_VISIT_AFTER_DAYS;
};
