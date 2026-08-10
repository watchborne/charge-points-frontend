import { Site } from "@watchborne/charge-points-types";
import { useTranslations } from "next-intl";
import { useEffect, useState, useCallback } from "react";

import { api } from "@/lib/api";

export interface UseSitesReturn {
  sites: Site[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSites(): UseSitesReturn {
  const t = useTranslations("");

  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSites = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await api.Sites.getSites();
      setSites(data);
    } catch (err) {
      setError(t("errors.loadingSites"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSites();
  }, [loadSites]);

  return {
    sites,
    loading,
    error,
    refetch: loadSites,
  };
}
