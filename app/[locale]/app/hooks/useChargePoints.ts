import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useCallback, useRef } from "react";

import { useToastNotification } from "@/app/components/ToastNotification";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
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
  // Read through refs (rather than as effect dependencies) below: `t` from
  // `useTranslations` and `pushWarningNotification` are not guaranteed to be
  // referentially stable across renders, and this effect must only re-run
  // when a new WebSocket message actually arrives.
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

  useEffect(() => {
    if (error) console.error(error);
  }, [error]);

  // Same shape as loadChargePoints below, but doesn't touch the query's
  // loading/error state: used when resyncing after a WebSocket reconnection,
  // where showing a loading spinner or an error banner would just be visual
  // flicker over data that's already on screen.
  const refetchSilently = useCallback(async () => {
    try {
      const freshData = await api.ChargePoints.getChargePoints();
      queryClient.setQueryData<ChargePointWithConnectors[]>(
        queryKeys.chargePoints.all(),
        freshData,
      );
    } catch (err) {
      console.error("Failed to refetch charge points:", err);
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

  // Le WebSocket ne rejoue pas les événements manqués pendant une coupure : on
  // resynchronise via un refetch REST à chaque reconnexion (mais pas à la
  // toute première connexion, déjà couverte par le fetch initial ci-dessus).
  // Use refetchSilently instead of a tracked refetch to avoid showing the
  // loading state, which causes visual flicker on dashboard reconnections.
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
