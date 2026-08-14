import { SiteHealth } from "@watchborne/charge-points-types";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { SiteHealthBadge } from "./SiteHealthBadge";
import { SiteWithHealth } from "./SiteHealthSection";

/** Worse first: CRITICAL before DEGRADED. HEALTHY never appears — see the
 * filter below — so it has no rank here. */
const SEVERITY_RANK: Record<SiteHealth["status"], number> = {
  CRITICAL: 0,
  DEGRADED: 1,
  HEALTHY: 2,
};

const affectedCount = (health: SiteHealth) =>
  health.chargePointsOffline + health.chargePointsWarning;

/** The top 3 sites to look at first: every non-HEALTHY site, worst status
 * first, ties broken by how many charge points are affected. Never padded
 * with HEALTHY sites just to reach 3 — fewer than 3 (or none) is the point,
 * not a gap to fill. */
export const SiteHealthWatchlist = ({ sitesWithHealth }: { sitesWithHealth: SiteWithHealth[] }) => {
  const t = useTranslations("");

  const watchlist = useMemo(
    () =>
      sitesWithHealth
        .filter(({ health }) => health.status !== "HEALTHY")
        .sort((a, b) => {
          const severityDiff = SEVERITY_RANK[a.health.status] - SEVERITY_RANK[b.health.status];
          return severityDiff !== 0
            ? severityDiff
            : affectedCount(b.health) - affectedCount(a.health);
        })
        .slice(0, 3),
    [sitesWithHealth],
  );

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold text-foreground">
        {t("appPage.dashboard.siteHealth.watchlist.title")}
      </h3>
      {watchlist.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("appPage.dashboard.siteHealth.watchlist.empty")}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {watchlist.map(({ site, health }) => (
            <li key={site.id} className="flex items-center justify-between gap-3">
              <span className="truncate font-medium">{site.name}</span>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {t("appPage.dashboard.siteHealth.watchlist.affected", {
                    count: affectedCount(health),
                  })}
                </span>
                <SiteHealthBadge status={health.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
