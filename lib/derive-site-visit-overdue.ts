import type { Site } from "@watchborne/charge-points-types";

/**
 * Client-side port of `charge-points-server`'s `findOverdueSites`
 * (`src/application/shared/find-overdue-sites.ts`) — kept in lockstep with
 * it: same threshold, same fallback. See that file for the full rationale;
 * duplicated here rather than shared across repos because the two projects
 * don't share application code, only the wire types.
 *
 * Derived from `Site.lastVisitedAt`/`installedAt` — already fetched for
 * every other site panel — rather than a new round trip to the backend's
 * own `SiteVisit` history, the same "derive client-side from already-fetched
 * data" pattern `derive-site-health.ts` uses for `SiteHealthBadge`.
 */
export const OVERDUE_VISIT_AFTER_DAYS = 90;

/**
 * Whether `site` hasn't been visited within `OVERDUE_VISIT_AFTER_DAYS` —
 * `installedAt` stands in for a site never visited. Exactly the threshold is
 * not yet overdue, matching the backend's strictly-greater-than rule.
 */
export const isSiteVisitOverdue = (site: Site, now: Date = new Date()): boolean => {
  const lastActivity = site.lastVisitedAt
    ? new Date(site.lastVisitedAt)
    : new Date(site.installedAt);
  const daysSinceLastActivity = (now.getTime() - lastActivity.getTime()) / (24 * 60 * 60 * 1000);

  return daysSinceLastActivity > OVERDUE_VISIT_AFTER_DAYS;
};
