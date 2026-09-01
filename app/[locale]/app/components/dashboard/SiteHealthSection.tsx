import { Site, SiteHealth } from "@watchborne/charge-points-types";
import { useMemo } from "react";

import { SiteHealthBreakdown } from "./SiteHealthBreakdown";
import { SiteHealthList } from "./SiteHealthList";
import { SiteHealthWatchlist } from "./SiteHealthWatchlist";

export type SiteWithHealth = { site: Site; health: SiteHealth };

/**
 * The dashboard's site-health section: a global breakdown, a "watch these
 * first" shortlist, and the full per-site list — replaces the single
 * fleet-wide tile this used to be.
 *
 * Joins `sitesHealth` (derived client-side from `chargePoints` — see
 * `lib/derive-site-health.ts`) against `sites` (already fetched for the
 * dashboard) by `siteId` — `SiteHealth` carries no site name of its own on
 * purpose (see `charge-points-types`). An entry with no match on either side
 * is dropped rather than shown half-filled.
 */
export const SiteHealthSection = ({
  sites,
  sitesHealth,
}: {
  sites: Site[];
  sitesHealth: SiteHealth[];
}) => {
  const sitesWithHealth = useMemo<SiteWithHealth[]>(() => {
    const healthBySiteId = new Map(sitesHealth.map((health) => [health.siteId, health]));

    return sites
      .map((site) => {
        const health = healthBySiteId.get(site.id);
        return health ? { site, health } : null;
      })
      .filter((entry): entry is SiteWithHealth => entry !== null);
  }, [sites, sitesHealth]);

  if (sitesWithHealth.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <SiteHealthBreakdown sitesHealth={sitesHealth} />
      <SiteHealthWatchlist sitesWithHealth={sitesWithHealth} />
      <SiteHealthList sitesWithHealth={sitesWithHealth} />
    </div>
  );
};
