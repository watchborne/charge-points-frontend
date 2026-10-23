import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Site } from "@watchborne/charge-points-types";

import { api } from "@/lib/api";
import type { UpdateSiteAlertThresholdsBody } from "@/lib/api-site-alert-thresholds";
import { queryKeys } from "@/lib/queryKeys";

/**
 * A site's alert-threshold overrides and the thresholds its charge points
 * inherit.
 */
export function useSiteAlertThresholds(siteId: Site["id"] | null) {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.siteAlertThresholds.site(siteId ?? ""),
    queryFn: () => api.SiteAlertThresholds.get(siteId!),
    enabled: siteId !== null,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.siteAlertThresholds.site(siteId ?? ""),
    });
    // A station without its own override inherits what the site just changed.
    void queryClient.invalidateQueries({ queryKey: queryKeys.chargePointAlertThresholds.all() });
  };

  const updateMutation = useMutation({
    mutationFn: (body: UpdateSiteAlertThresholdsBody) =>
      api.SiteAlertThresholds.update(siteId!, body),
    onSuccess: invalidate,
  });

  const resetMutation = useMutation({
    mutationFn: () => api.SiteAlertThresholds.reset(siteId!),
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
