import { useQuery } from "@tanstack/react-query";
import { Site } from "@watchborne/charge-points-types";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";

export interface UseSitesReturn {
  sites: Site[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSites(): UseSitesReturn {
  const t = useTranslations("");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.sites.all(),
    queryFn: api.Sites.getSites,
    retry: false,
  });

  useEffect(() => {
    if (error) console.error(error);
  }, [error]);

  return {
    sites: data ?? [],
    loading: isLoading,
    error: isError ? t("errors.loadingSites") : null,
    refetch: async () => {
      await refetch();
    },
  };
}
