import { SiteHealth } from "@watchborne/charge-points-types";
import { useTranslations } from "next-intl";
import { useEffect, useState, useCallback } from "react";

import { api } from "@/lib/api";

export interface UseSitesHealthReturn {
  sitesHealth: SiteHealth[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSitesHealth(): UseSitesHealthReturn {
  const t = useTranslations("");

  const [sitesHealth, setSitesHealth] = useState<SiteHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSitesHealth = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await api.Sites.getSitesHealth();
      setSitesHealth(data);
    } catch (err) {
      setError(t("errors.loadingSitesHealth"));
      console.error(err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadSitesHealth();
  }, [loadSitesHealth]);

  return {
    sitesHealth,
    loading,
    error,
    refetch: loadSitesHealth,
  };
}
