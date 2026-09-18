import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

import { api } from "@/lib/api";
import type { CreateFirmwareCampaignBody } from "@/lib/api-firmware-campaigns";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Scheduled fleet-wide firmware campaigns (`GET`/`POST /api/firmware-campaigns`) —
 * `useQuery`/`useMutation` over `api.FirmwareCampaigns.list`/`create`/`cancel`,
 * mirroring `useSiteVisitSchedule`'s pattern.
 */
export function useFirmwareCampaigns() {
  const t = useTranslations("");
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.firmwareCampaigns.lists(),
    queryFn: api.FirmwareCampaigns.list,
  });

  useEffect(() => {
    if (error) {
      Sentry.captureException(error, { tags: { hook: "useFirmwareCampaigns" } });
    }
  }, [error]);

  const createMutation = useMutation({
    mutationFn: (body: CreateFirmwareCampaignBody) => api.FirmwareCampaigns.create(body),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.firmwareCampaigns.lists() }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.FirmwareCampaigns.cancel(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.firmwareCampaigns.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.firmwareCampaigns.detail(id) });
    },
  });

  return {
    campaigns: data ?? [],
    loading: isLoading,
    error: isError ? t("errors.loadingFirmwareCampaigns") : null,
    create: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    cancel: cancelMutation.mutateAsync,
    isCanceling: cancelMutation.isPending,
  };
}
