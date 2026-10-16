"use client";

import { useQuery } from "@tanstack/react-query";
import { useFormatter, useTranslations } from "next-intl";

import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { ChargePoint } from "@/types/charge-point";

import { CostCell, type ChargingSessionListEntry } from "./ChargingSessionsPanel";

/** An ended session's estimated cost only moves when the site's tariff does,
 * so a cached answer is good for a while: flipping between tabs or charge
 * points must not re-ask for every row each time (the `/api/*` rate limit is
 * shared with the rest of the dashboard). */
const COST_STALE_TIME_MS = 5 * 60 * 1000;

type ChargingSessionCostCellProps = {
  chargePointId: ChargePoint["id"];
  session: Pick<ChargingSessionListEntry, "id" | "status">;
};

/**
 * One row's estimated cost (charge-points-server issue #580), fetched on its
 * own so a slow or failing lookup only affects that row, and cached so the
 * request is made once per session rather than on every mount. An `ACTIVE`
 * session is never asked about: the answer is always `SESSION_STILL_ACTIVE`.
 * A failed lookup says so, instead of reading like "no cost".
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
