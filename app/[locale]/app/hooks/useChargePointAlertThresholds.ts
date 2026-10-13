import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChargePoint } from "@watchborne/charge-points-types";

import { api } from "@/lib/api";
import type { UpdateChargePointAlertThresholdsBody } from "@/lib/api-charge-points-alert-thresholds";
import { queryKeys } from "@/lib/queryKeys";

/**
 * A charge point's own alert-threshold overrides and the thresholds actually
 * applied to it — own override, else its site's, else the default (charge-points-
 * server issue #577). `useQuery`/`useMutation` over `api.ChargePointAlertThresholds`,
 * mirroring `useSiteAlertThresholds`.
 */
export function useChargePointAlertThresholds(chargePointId: ChargePoint["id"] | null) {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.chargePointAlertThresholds.chargePoint(chargePointId ?? ""),
    queryFn: () => api.ChargePointAlertThresholds.get(chargePointId!),
    enabled: chargePointId !== null,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.chargePointAlertThresholds.chargePoint(chargePointId ?? ""),
    });
  };

  const updateMutation = useMutation({
    mutationFn: (body: UpdateChargePointAlertThresholdsBody) =>
      api.ChargePointAlertThresholds.update(chargePointId!, body),
    onSuccess: invalidate,
  });

  const resetMutation = useMutation({
    mutationFn: () => api.ChargePointAlertThresholds.reset(chargePointId!),
    onSuccess: invalidate,
  });

  return {
    thresholds: data?.thresholds ?? null,
    effective: data?.effective ?? null,
    loading: isLoading,
    error: isError,
    updateThresholds: updateMutation.mutateAsync,
    resetThresholds: resetMutation.mutateAsync,
    isSaving: updateMutation.isPending || resetMutation.isPending,
  };
}
