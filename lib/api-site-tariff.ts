import type { Site } from "@watchborne/charge-points-types";

import { withErrorLogging } from "./api-error-wrapper";
import { httpClient } from "./http-client";

// A site's currently configured flat tariff — not part of
// @watchborne/charge-points-types, like SiteVisit/SecurityEvent above: the
// backend keeps `SiteTariff` server-local (charge-points-server issue #580)
// since no client consumes it as a domain entity. Not historized: this is
// always the rate in effect right now, never the one that applied to a
// specific past session.

export type SiteTariff = {
  siteId: string;
  currency: string;
  /** Integer cents per kWh — see the backend's own note on why not a float. */
  pricePerKwhCents: number;
  createdAt: string;
  updatedAt: string;
};

/** `GET /api/sites/:id/tariff`'s envelope: `tariff` is null when none is configured yet. */
export type GetSiteTariffResult = {
  siteId: string;
  tariff: SiteTariff | null;
};

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
