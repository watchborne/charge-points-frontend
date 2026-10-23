import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { FleetReliability } from "@/lib/api-fleet-reliability";
import { queryKeys } from "@/lib/queryKeys";

export type UseFleetReliabilityReturn = {
  /** `null` before the first load resolves, or WHEN it failed. */
  reliability: FleetReliability | null;
  loading: boolean;
  failed: boolean;
};

/**
 * The fleet-wide reliability ranking, fetched once for the dashboard. The
 * backend ranks over a fixed window, so there is no parameter.
 */
export const useFleetReliability = (): UseFleetReliabilityReturn => {
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.fleetReliability.all(),
    queryFn: () => api.FleetReliability.getFleetReliability(),
  });

  return {
    reliability: data ?? null,
    loading: isLoading,
    failed: isError,
  };
};
