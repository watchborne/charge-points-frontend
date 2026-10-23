import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Site } from "@watchborne/charge-points-types";

import { api } from "@/lib/api";
import type { RecordSiteVisitBody } from "@/lib/api-site-visits";
import { queryKeys } from "@/lib/queryKeys";

/** A site's visit history. */
export function useSiteVisits(siteId: Site["id"] | null) {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.siteVisits.site(siteId ?? ""),
    queryFn: () => api.SiteVisits.list(siteId!),
    enabled: siteId !== null,
  });

  const recordVisitMutation = useMutation({
    mutationFn: (body: RecordSiteVisitBody) => api.SiteVisits.record(siteId!, body),
    onSuccess: () => {
      // A visit also changes the site's derived `lastVisitedAt`.
      void queryClient.invalidateQueries({ queryKey: queryKeys.siteVisits.site(siteId ?? "") });
      void queryClient.invalidateQueries({ queryKey: queryKeys.sites.all() });
    },
  });

  return {
    visits: data ?? [],
    loading: isLoading,
    error: isError,
    recordVisit: recordVisitMutation.mutateAsync,
    isRecording: recordVisitMutation.isPending,
  };
}
