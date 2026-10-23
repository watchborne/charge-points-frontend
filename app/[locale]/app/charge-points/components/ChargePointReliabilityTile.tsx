"use client";

import { useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

import { api } from "@/lib/api";
import type { ChargePointUptime } from "@/lib/api-uptime";
import { queryKeys } from "@/lib/queryKeys";
import type { ChargePoint } from "@/types/charge-point";

type ChargePointReliabilityTileProps = {
  chargePointId: ChargePoint["id"];
};

/**
 * `onlineMs`/`totalMs` as a percentage; `null` for a zero-length window.
 */
const formatPercentage = (uptime: ChargePointUptime): string | null =>
  uptime.totalMs > 0 ? `${((uptime.onlineMs / uptime.totalMs) * 100).toFixed(1)}%` : null;

/**
 * A charge point's reliability over the last 7 days: the share of the window
 * spent in any status but OFFLINE, reduced server-side. Named "reliability"
 * because "availability" (ChangeAvailability) and "uptime" (time since the
 * last status change) already mean other things on this page. Fetch-once.
 */
export const ChargePointReliabilityTile = ({ chargePointId }: ChargePointReliabilityTileProps) => {
  const t = useTranslations("");

  const {
    data: uptime,
    isLoading: loading,
    isError: failed,
  } = useQuery({
    queryKey: queryKeys.uptime.chargePoint(chargePointId),
    queryFn: () => api.Uptime.getChargePointUptime(chargePointId),
  });

  const percentage = uptime ? formatPercentage(uptime) : null;

  return (
    <div className="flex flex-col rounded-lg border bg-card p-3">
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">
          {t("appPage.chargePoints.reliability.title")}
        </p>
        <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
      </div>

      <p className="text-lg font-bold text-foreground">
        {loading
          ? "—"
          : failed
            ? t("common.error")
            : (percentage ?? t("appPage.chargePoints.reliability.noData"))}
      </p>

      <p className="mt-0.5 text-[11px] text-muted-foreground">
        {t("appPage.chargePoints.reliability.window")}
      </p>
    </div>
  );
};
