import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Site } from "@watchborne/charge-points-types";

import { api } from "@/lib/api";
import type { UpsertSiteTariffBody } from "@/lib/api-site-tariff";
import { queryKeys } from "@/lib/queryKeys";

/**
 * A site's currently configured flat tariff (charge-points-server issue
 * #580) — `useQuery`/`useMutation` over `api.SiteTariff`, mirroring
 * `useSiteVisits`' pattern.
 */
export function useSiteTariff(siteId: Site["id"] | null) {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.siteTariff.site(siteId ?? ""),
    queryFn: () => api.SiteTariff.get(siteId!),
    enabled: siteId !== null,
  });

  const upsertTariffMutation = useMutation({
    mutationFn: (body: UpsertSiteTariffBody) => api.SiteTariff.upsert(siteId!, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.siteTariff.site(siteId ?? "") });
    },
  });

  return {
    tariff: data?.tariff ?? null,
    loading: isLoading,
    error: isError,
    upsertTariff: upsertTariffMutation.mutateAsync,
    isSaving: upsertTariffMutation.isPending,
  };
}
