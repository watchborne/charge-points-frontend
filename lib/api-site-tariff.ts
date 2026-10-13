import type {
  GetSiteTariffResult as SharedGetSiteTariffResult,
  Site,
  SiteTariff as SharedSiteTariff,
} from "@watchborne/charge-points-types";

import { withErrorLogging } from "./api-error-wrapper";
import { httpClient } from "./http-client";
import type { Wire } from "./wire";

// A site's currently configured flat tariff: the shared `SiteTariff` entity
// (@watchborne/charge-points-types), as it looks once serialized to JSON —
// timestamps arrive as ISO strings (see `Wire`). Not historized: this is always
// the rate in effect right now, never the one that applied to a specific past
// session (charge-points-server issue #580).

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
