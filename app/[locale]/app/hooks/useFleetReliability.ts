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
 * Fetches the fleet-wide reliability ranking (charge-points-server issue
 * #581) once for the whole dashboard. Unlike `useConsumption`, there is no
 * range to pick: the backend already reduces to one worst-first ranking over
 * its own fixed rolling window, so this hook is a plain, parameterless
 * `useQuery` wrapper.
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
