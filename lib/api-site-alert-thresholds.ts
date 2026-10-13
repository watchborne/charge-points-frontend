import type {
  GetSiteAlertThresholdsResult as SharedGetSiteAlertThresholdsResult,
  Site,
  SiteAlertThresholds as SharedSiteAlertThresholds,
  UpdateAlertThresholds,
} from "@watchborne/charge-points-types";

import { withErrorLogging } from "./api-error-wrapper";
import { httpClient } from "./http-client";
import type { Wire } from "./wire";

// A site's overrides of the time-based alert thresholds: the shared
// `SiteAlertThresholds` entity (@watchborne/charge-points-types), as it looks
// once serialized to JSON — timestamps arrive as ISO strings (see `Wire`). A
// `null` threshold means "inherit the global default" (charge-points-server
// issue #577, ADR 0031).

export type SiteAlertThresholds = Wire<SharedSiteAlertThresholds>;

/**
 * `GET /api/sites/:id/alert-thresholds`'s envelope: `thresholds` is null when
 * the site has no overrides yet, and `effective` is what its charge points
 * inherit — resolved by the backend, never guessed here.
 */
export type GetSiteAlertThresholdsResult = Wire<SharedGetSiteAlertThresholdsResult>;

/** Partial update: an omitted threshold is untouched, `null` clears it. */
export type UpdateSiteAlertThresholdsBody = UpdateAlertThresholds;

export const siteAlertThresholdsApis = {
  get: async function (siteId: Site["id"]): Promise<GetSiteAlertThresholdsResult> {
    return withErrorLogging(
      () => httpClient.get<GetSiteAlertThresholdsResult>(`/api/sites/${siteId}/alert-thresholds`),
      `SiteAlertThresholds.get(${siteId})`,
    );
  },
  update: async function (
    siteId: Site["id"],
    body: UpdateSiteAlertThresholdsBody,
  ): Promise<SiteAlertThresholds> {
    return withErrorLogging(
      () => httpClient.patch<SiteAlertThresholds>(`/api/sites/${siteId}/alert-thresholds`, body),
      `SiteAlertThresholds.update(${siteId})`,
    );
  },
  reset: async function (siteId: Site["id"]): Promise<void> {
    return withErrorLogging(
      () => httpClient.delete(`/api/sites/${siteId}/alert-thresholds`),
      `SiteAlertThresholds.reset(${siteId})`,
    );
  },
};
