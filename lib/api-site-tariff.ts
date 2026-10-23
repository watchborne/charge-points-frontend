import type {
  GetSiteTariffResult as SharedGetSiteTariffResult,
  Site,
  SiteTariff as SharedSiteTariff,
} from "@watchborne/charge-points-types";

import { withErrorLogging } from "./api-error-wrapper";
import { httpClient } from "./http-client";
import type { Wire } from "./wire";

// A site's flat tariff. Not historized: always the rate in effect now.

export type SiteTariff = Wire<SharedSiteTariff>;

/** `GET /api/sites/:id/tariff`'s envelope: `tariff` is null when none is configured yet. */
export type GetSiteTariffResult = Wire<SharedGetSiteTariffResult>;

export type UpsertSiteTariffBody = {
  currency: string;
  pricePerKwhCents: number;
};

export const siteTariffApis = {
  get: async function (siteId: Site["id"]): Promise<GetSiteTariffResult> {
    return withErrorLogging(
      () => httpClient.get<GetSiteTariffResult>(`/api/sites/${siteId}/tariff`),
      `SiteTariff.get(${siteId})`,
    );
  },
  upsert: async function (siteId: Site["id"], body: UpsertSiteTariffBody): Promise<SiteTariff> {
    return withErrorLogging(
      () => httpClient.put<SiteTariff>(`/api/sites/${siteId}/tariff`, body),
      `SiteTariff.upsert(${siteId})`,
    );
  },
};
