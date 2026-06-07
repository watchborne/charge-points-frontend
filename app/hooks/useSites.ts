import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Site } from "@ev-charge-point-monitor/charge-point-types";

export interface UseSitesReturn {
  sites: Site[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSites(): UseSitesReturn {
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
      setError(
        "Impossible de charger les sites. Vérifiez que le backend tourne sur http://localhost:3000",
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSites();
  }, [loadSites]);

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
