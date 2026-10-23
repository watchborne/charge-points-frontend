import { Site, SiteHealth } from "@watchborne/charge-points-types";
import { useMemo } from "react";

import { SiteHealthBreakdown } from "./SiteHealthBreakdown";
import { SiteHealthList } from "./SiteHealthList";
import { SiteHealthWatchlist } from "./SiteHealthWatchlist";

export type SiteWithHealth = { site: Site; health: SiteHealth };

/**
 * The dashboard's site health: a global breakdown, a "watch these first"
 * shortlist and the per-site list. Joins `sitesHealth` (derived from
 * `chargePoints`) to `sites` by `siteId`, since `SiteHealth` carries no name;
 * an entry with no match on either side is dropped.
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
