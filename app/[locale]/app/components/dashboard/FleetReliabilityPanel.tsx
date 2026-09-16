"use client";

import {
  Callout,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@watchborne/electrons";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import { reliabilityBucket, reliabilityTrend, uptimeRatio } from "@/lib/fleet-reliability";

import { FleetReliabilityBadge } from "./FleetReliabilityBadge";
import { FleetReliabilityPanelSkeleton } from "./FleetReliabilityPanelSkeleton";
import { useFleetReliability } from "../../hooks/useFleetReliability";

const TREND_ICON = {
  up: <TrendingUp className="h-3.5 w-3.5 text-status-available-foreground" />,
  down: <TrendingDown className="h-3.5 w-3.5 text-status-error-foreground" />,
  stable: <Minus className="h-3.5 w-3.5 text-muted-foreground" />,
} as const;

/**
 * The fleet-wide reliability ranking (charge-points-server issue #581):
 * every visible charge point, worst-first, by its current 30-day uptime
 * ratio against the immediately preceding 30 days — "which station needs
 * attention" made visible without opening each one individually.
 *
 * The backend already does the ranking and the batching (one composite
 * query, no N+1); this panel only derives display buckets/trend arrows
 * (`lib/fleet-reliability.ts`) and renders the table the backend's order
 * already gives it — it never re-sorts.
 */
export const FleetReliabilityPanel = () => {
  const t = useTranslations("");
  const router = useRouter();
  const { reliability, loading, failed } = useFleetReliability();

  if (loading) return <FleetReliabilityPanelSkeleton />;

  if (failed) {
    return <Callout variant="error" description={t("appPage.dashboard.fleetReliability.error")} />;
  }

  const entries = reliability?.chargePoints ?? [];

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">
          {t("appPage.dashboard.fleetReliability.title")}
        </h3>
        <span className="text-xs text-muted-foreground">
          {t("appPage.dashboard.fleetReliability.subtitle")}
        </span>
      </div>

      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          {t("appPage.dashboard.fleetReliability.empty")}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("appPage.dashboard.fleetReliability.columns.chargePoint")}</TableHead>
              <TableHead>{t("appPage.dashboard.fleetReliability.columns.status")}</TableHead>
              <TableHead className="text-right">
                {t("appPage.dashboard.fleetReliability.columns.uptime")}
              </TableHead>
              <TableHead className="text-right hidden sm:table-cell">
                {t("appPage.dashboard.fleetReliability.columns.incidents")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => {
              const ratio = uptimeRatio(entry);
              const bucket = reliabilityBucket(ratio);
              const trend = reliabilityTrend(entry);

              return (
                <TableRow
                  key={entry.chargePointId}
                  onClick={() => router.push(`/app/charge-points?id=${entry.chargePointId}`)}
                  className="cursor-pointer"
                >
                  <TableCell className="max-w-[12rem] truncate font-medium">{entry.name}</TableCell>
                  <TableCell>
                    <FleetReliabilityBadge bucket={bucket} />
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center justify-end gap-1.5">
                      {TREND_ICON[trend]}
                      {(ratio * 100).toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right hidden sm:table-cell">
                    {entry.incidentCount}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
};
