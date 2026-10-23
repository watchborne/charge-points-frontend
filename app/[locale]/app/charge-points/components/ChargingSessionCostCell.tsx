"use client";

import { useQuery } from "@tanstack/react-query";
import { useFormatter, useTranslations } from "next-intl";

import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { ChargePoint } from "@/types/charge-point";

import { CostCell, type ChargingSessionListEntry } from "./ChargingSessionsPanel";

/** An ended session's cost only changes with the tariff; caching it spares the
 * shared `/api/*` rate limit. */
const COST_STALE_TIME_MS = 5 * 60 * 1000;

type ChargingSessionCostCellProps = {
  chargePointId: ChargePoint["id"];
  session: Pick<ChargingSessionListEntry, "id" | "status">;
};

/**
 * One row's estimated cost, fetched and cached per row so a failure only
 * affects that row. Never asked for an `ACTIVE` session; a failed lookup says
 * so rather than reading as "no cost".
 */
export const ChargingSessionCostCell = ({
  chargePointId,
  session,
}: ChargingSessionCostCellProps) => {
  const t = useTranslations("");
  const intlFormat = useFormatter();

  const {
    data: cost,
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.chargingSessions.cost(chargePointId, session.id),
    queryFn: () => api.ChargePoints.getChargingSessionCost(chargePointId, session.id),
    enabled: session.status === "ENDED",
    staleTime: COST_STALE_TIME_MS,
  });

  if (isLoading) {
    return (
      <span aria-busy="true" className="text-muted-foreground">
        …
      </span>
    );
  }

  if (isError) {
    return (
      <span className="text-destructive">
        {t("appPage.chargePoints.chargingSessions.costLoadError")}
      </span>
    );
  }

  return <CostCell cost={cost} intlFormat={intlFormat} t={t} />;
};
