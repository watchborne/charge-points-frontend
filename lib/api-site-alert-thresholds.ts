import type {
  GetSiteAlertThresholdsResult as SharedGetSiteAlertThresholdsResult,
  Site,
  SiteAlertThresholds as SharedSiteAlertThresholds,
  UpdateAlertThresholds,
} from "@watchborne/charge-points-types";

import { withErrorLogging } from "./api-error-wrapper";
import { httpClient } from "./http-client";
import type { Wire } from "./wire";

// A site's threshold overrides; `null` inherits the global default.

export type SiteAlertThresholds = Wire<SharedSiteAlertThresholds>;

/**
 * `thresholds` is null without overrides; `effective` is what its charge
 * points inherit, resolved by the backend.
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
