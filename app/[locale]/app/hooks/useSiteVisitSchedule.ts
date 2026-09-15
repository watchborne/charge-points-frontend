import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Site } from "@watchborne/charge-points-types";

import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";

/**
 * A site's planned next visit (charge-points-server issue #579, ADR 0016) —
 * `useQuery`/`useMutation` over `api.SiteVisits.getSchedule`/`scheduleNextVisit`/
 * `cancelNextVisit`, mirroring `useSiteVisits`'s pattern. Kept as its own hook
 * rather than folded into `useSiteVisits`: the schedule is a singleton plan,
 * not part of the visit history it reads from a different endpoint.
 */
export function useSiteVisitSchedule(siteId: Site["id"] | null) {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.siteVisitSchedule.site(siteId ?? ""),
    queryFn: () => api.SiteVisits.getSchedule(siteId!),
    enabled: siteId !== null,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.siteVisitSchedule.site(siteId ?? "") });

  const scheduleMutation = useMutation({
    mutationFn: (nextVisitAt: string) => api.SiteVisits.scheduleNextVisit(siteId!, nextVisitAt),
    onSuccess: invalidate,
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.SiteVisits.cancelNextVisit(siteId!),
    onSuccess: invalidate,
  });

  return {
    schedule: data ?? null,
    loading: isLoading,
    error: isError,
    scheduleNextVisit: scheduleMutation.mutateAsync,
    isScheduling: scheduleMutation.isPending,
    cancelNextVisit: cancelMutation.mutateAsync,
    isCanceling: cancelMutation.isPending,
  };
}
