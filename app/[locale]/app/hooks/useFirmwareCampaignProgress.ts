import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";

/**
 * One campaign's detail and progress (`GET /api/firmware-campaigns/:id`), for
 * `FirmwareCampaignDetailModal`.
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
