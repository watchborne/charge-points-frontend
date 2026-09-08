import type { Site } from "@watchborne/charge-points-types";

import { withErrorLogging } from "./api-error-wrapper";
import { httpClient } from "./http-client";

// The site-visit history's response shape. Not part of
// @watchborne/charge-points-types on purpose, like SecurityEvent/
// ConnectionStateEvent above: the backend keeps `SiteVisit` server-local
// (charge-points-server ADR 0015) since no client consumes it as a domain
// entity — the dashboard codes against this response contract. Timestamps
// arrive as ISO strings and are parsed where rendered, never widened to
// `Date` here.

/** One on-site maintenance visit, as `GET /api/sites/:id/visits` returns it. */
export type SiteVisit = {
  id: string;
  siteId: string;
  /** ISO string: when the site was actually visited. */
  visitedAt: string;
  note: string | null;
  recordedBy: { userId: string; email: string };
  createdAt: string;
};

export type SiteVisitQuery = {
  since?: Date;
  until?: Date;
  limit?: number;
};

export type RecordSiteVisitBody = {
  /** ISO string: never in the future (enforced server-side). */
  visitedAt: string;
  note?: string;
};

const buildQuery = ({ since, until, limit }: SiteVisitQuery = {}): string => {
  const params = new URLSearchParams();

  if (since) params.set("since", since.toISOString());
  if (until) params.set("until", until.toISOString());
  if (limit !== undefined) params.set("limit", String(limit));

  const query = params.toString();
  return query ? `?${query}` : "";
};

export const siteVisitApis = {
  list: async function (siteId: Site["id"], query: SiteVisitQuery = {}): Promise<SiteVisit[]> {
    return withErrorLogging(
      () => httpClient.get<SiteVisit[]>(`/api/sites/${siteId}/visits${buildQuery(query)}`),
      `SiteVisits.list(${siteId})`,
    );
  },
  record: async function (siteId: Site["id"], body: RecordSiteVisitBody): Promise<SiteVisit> {
    return withErrorLogging(
      () => httpClient.post<SiteVisit>(`/api/sites/${siteId}/visits`, body),
      `SiteVisits.record(${siteId})`,
    );
  },
};
