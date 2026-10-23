import type {
  Site,
  SiteVisit as SharedSiteVisit,
  SiteVisitSchedule as SharedSiteVisitSchedule,
} from "@watchborne/charge-points-types";

import { withErrorLogging } from "./api-error-wrapper";
import { httpClient } from "./http-client";
import type { Wire } from "./wire";

/** One on-site maintenance visit, as `GET /api/sites/:id/visits` returns it. */
export type SiteVisit = Wire<SharedSiteVisit>;

/** A site's planned next visit (`GET`/`PUT /api/sites/:id/next-visit`). `GET` answers `null` when none is scheduled. */
export type SiteVisitSchedule = Wire<SharedSiteVisitSchedule>;

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
  getSchedule: async function (siteId: Site["id"]): Promise<SiteVisitSchedule | null> {
    return withErrorLogging(
      () => httpClient.get<SiteVisitSchedule | null>(`/api/sites/${siteId}/next-visit`),
      `SiteVisits.getSchedule(${siteId})`,
    );
  },
  /** `nextVisitAt` is an ISO string, never in the past (enforced server-side). */
  scheduleNextVisit: async function (
    siteId: Site["id"],
    nextVisitAt: string,
  ): Promise<SiteVisitSchedule> {
    return withErrorLogging(
      () => httpClient.put<SiteVisitSchedule>(`/api/sites/${siteId}/next-visit`, { nextVisitAt }),
      `SiteVisits.scheduleNextVisit(${siteId})`,
    );
  },
  cancelNextVisit: async function (siteId: Site["id"]): Promise<void> {
    return withErrorLogging(
      () => httpClient.delete(`/api/sites/${siteId}/next-visit`),
      `SiteVisits.cancelNextVisit(${siteId})`,
    );
  },
};
