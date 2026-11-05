import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { CreatedChargePoint } from "@/types/charge-point";

import type { ChargePointFormValues } from "../components/ChargePointFormDialog";

// The form's optional meta fields reach the API as empty strings, never undefined.
const toMeta = (meta: ChargePointFormValues["meta"]) => ({
  vendor: meta?.vendor ?? "",
  model: meta?.model ?? "",
  serialNumber: meta?.serialNumber ?? "",
  firmwareVersion: meta?.firmwareVersion ?? "",
});

/**
 * Create / edit / commission / delete a charge point. Each one invalidates the
 * charge point queries on success, so the list refetches.
 */
export const useChargePointMutations = () => {
  const queryClient = useQueryClient();

  const invalidateChargePoints = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.chargePoints.all() });

  const createMutation = useMutation({
    mutationFn: api.ChargePoints.createChargePoint,
    onSuccess: invalidateChargePoints,
  });
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: Parameters<typeof api.ChargePoints.updateChargePoint>[1];
    }) => api.ChargePoints.updateChargePoint(id, patch),
    onSuccess: invalidateChargePoints,
  });
  const deleteMutation = useMutation({
    mutationFn: api.ChargePoints.deleteChargePoint,
    onSuccess: invalidateChargePoints,
  });

  return {
    create: (values: ChargePointFormValues): Promise<CreatedChargePoint> =>
      createMutation.mutateAsync({
        name: values.name,
        // Empty selection means unassigned: send null, not "".
        siteId: values.siteId || null,
        isActive: values.isActive,
        meta: toMeta(values.meta),
      }),

    edit: async (id: string, values: ChargePointFormValues): Promise<void> => {
      await updateMutation.mutateAsync({
        id,
        patch: {
          name: values.name,
          // Empty selection detaches the charge point from its site.
          siteId: values.siteId || null,
          meta: toMeta(values.meta),
        },
      });
    },

    commission: async (
      id: string,
      values: { name: string; siteId: string | null },
    ): Promise<void> => {
      await updateMutation.mutateAsync({
        id,
        patch: { name: values.name, siteId: values.siteId },
      });
    },

    remove: async (id: string): Promise<void> => {
      await deleteMutation.mutateAsync(id);
    },
  };
};
