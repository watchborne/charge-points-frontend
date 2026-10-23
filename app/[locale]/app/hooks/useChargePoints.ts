import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useCallback, useRef } from "react";

import { useReportQueryError } from "@/app/[locale]/app/hooks/useReportQueryError";
import { useToastNotification } from "@/app/components/ToastNotification";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { reportError } from "@/lib/report-error";
import { ChargePointWithConnectors, isExpectedConnectorTransition } from "@/types/charge-point";

import { useWebSocketContext } from "./useWebSocketContext";

export interface UseChargePointsReturn {
  chargePoints: ChargePointWithConnectors[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useChargePoints(): UseChargePointsReturn {
  const t = useTranslations("");
  const queryClient = useQueryClient();
  const { lastMessage, status } = useWebSocketContext();
  const { pushWarningNotification } = useToastNotification();
  const hasConnectedRef = useRef(false);
  // Read through refs: `t` and `pushWarningNotification` aren't stable, and
  // the effect must only re-run on a new WebSocket message.
  const tRef = useRef(t);
  tRef.current = t;
  const pushWarningNotificationRef = useRef(pushWarningNotification);
  pushWarningNotificationRef.current = pushWarningNotification;

  const {
    data: chargePoints,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.chargePoints.all(),
    queryFn: api.ChargePoints.getChargePoints,
    retry: false,
  });

  useReportQueryError(error, "useChargePoints.load");

  // Like loadChargePoints, without touching loading/error state: used to
  // resync after a reconnection, over data already on screen.
  const refetchSilently = useCallback(async () => {
    try {
      const freshData = await api.ChargePoints.getChargePoints();
      queryClient.setQueryData<ChargePointWithConnectors[]>(
        queryKeys.chargePoints.all(),
        freshData,
      );
    } catch (err) {
      reportError(err, "useChargePoints.refetchSilently");
    }
  }, [queryClient]);

  useEffect(() => {
    if (lastMessage?.type !== "CHARGE_POINT_MONITORING") return;
    const incoming = lastMessage.payload?.chargePoint as ChargePointWithConnectors | undefined;
    if (!incoming) return;

    const previousChargePoints =
      queryClient.getQueryData<ChargePointWithConnectors[]>(queryKeys.chargePoints.all()) ?? [];
    const previous = previousChargePoints.find((cp) => cp.id === incoming.id);
    if (previous) {
      for (const connector of incoming.connectors ?? []) {
        const previousConnector = (previous.connectors ?? []).find(
          (c) => c.connectorId === connector.connectorId,
        );
        if (
          previousConnector &&
          !isExpectedConnectorTransition(previousConnector.status, connector.status)
        ) {
          pushWarningNotificationRef.current(
            tRef.current("appPage.chargePoints.anomalies.unexpectedTransition", {
              chargePointName: incoming.name,
              connectorId: connector.connectorId,
              from: previousConnector.status,
              to: connector.status,
            }),
          );
        }
      }
    }

    queryClient.setQueryData<ChargePointWithConnectors[]>(
      queryKeys.chargePoints.all(),
      (prev = []) => {
        const idx = prev.findIndex((cp) => cp.id === incoming.id);
        if (idx === -1) return [...prev, incoming];
        const next = [...prev];
        next[idx] = incoming;
        return next;
      },
    );
  }, [lastMessage, queryClient]);

  // The WebSocket doesn't replay events missed while disconnected, so resync
  // on every reconnection (not the first connection, covered by the initial
  // fetch), silently to avoid flicker.
  useEffect(() => {
    if (status !== "CONNECTED") return;
    if (hasConnectedRef.current) {
      void refetchSilently();
    }
    hasConnectedRef.current = true;
  }, [status, refetchSilently]);

  return {
    chargePoints: chargePoints ?? [],
    loading: isLoading,
    error: isError ? t("errors.loadingChargePoints") : null,
    refetch: async () => {
      await refetch();
    },
  };
}
