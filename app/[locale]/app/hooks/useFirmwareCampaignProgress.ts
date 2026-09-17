import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";

/**
 * A single campaign's detail + progress view (`GET /api/firmware-campaigns/:id`) —
 * mirrors `useSiteVisitSchedule`'s single-resource query half. Used by
 * `FirmwareCampaignDetailModal`, which only needs this once a campaign row is
 * clicked.
 */
export function useFirmwareCampaignProgress(id: string | null) {
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.firmwareCampaigns.detail(id ?? ""),
    queryFn: () => api.FirmwareCampaigns.getProgress(id!),
    enabled: id !== null,
  });

  return {
    progress: data ?? null,
    loading: isLoading,
    error: isError,
  };
}
