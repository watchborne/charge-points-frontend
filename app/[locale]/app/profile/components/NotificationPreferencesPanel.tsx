"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Callout, Skeleton, Switch } from "@watchborne/electrons";
import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import type { NotificationPreferences } from "@/lib/api-notification-preferences";
import { queryKeys } from "@/lib/queryKeys";

const DIGEST_HOURS_UTC = Array.from({ length: 24 }, (_, hour) => hour);

const formatHourUtc = (hour: number) => `${String(hour).padStart(2, "0")}:00 UTC`;

/**
 * Lets a user opt in/out of the daily alert digest email and pick their own
 * send hour (UTC), overriding charge-points-server's global default hour
 * (ADR 0018 there). Both fields default to the backend's own resolved
 * defaults — this panel never invents a client-side fallback for a user who
 * has not set anything yet.
 */
export const NotificationPreferencesPanel = () => {
  const t = useTranslations("");
  const queryClient = useQueryClient();

  const {
    data: preferences,
    isLoading: loading,
    isError: loadFailed,
  } = useQuery({
    queryKey: queryKeys.notificationPreferences.all(),
    queryFn: () => api.NotificationPreferences.getPreferences(),
  });

  const updateMutation = useMutation({
    mutationFn: (update: Partial<NotificationPreferences>) =>
      api.NotificationPreferences.updatePreferences(update),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.notificationPreferences.all(), updated);
    },
  });

  const error = loadFailed || updateMutation.isError ? t("common.error") : null;
  const saving = updateMutation.isPending;

  return (
    <section className="rounded-lg border">
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
        <Bell className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-sm font-medium">{t("appPage.profile.notifications.title")}</span>
      </div>
      <div className="flex flex-col gap-4 p-4">
        {error && <Callout variant="error" description={error} />}

        {loading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : (
          preferences && (
            <>
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm">
                    {t("appPage.profile.notifications.digestEnabled.title")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t("appPage.profile.notifications.digestEnabled.description")}
                  </span>
                </div>
                <Switch
                  checked={preferences.digestEnabled}
                  disabled={saving}
                  onCheckedChange={(checked) => updateMutation.mutate({ digestEnabled: checked })}
                  aria-label={t("appPage.profile.notifications.digestEnabled.title")}
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm">
                    {t("appPage.profile.notifications.digestHour.title")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t("appPage.profile.notifications.digestHour.description")}
                  </span>
                </div>
                <Select
                  value={String(preferences.digestHourUtc)}
                  disabled={!preferences.digestEnabled || saving}
                  onValueChange={(value) => updateMutation.mutate({ digestHourUtc: Number(value) })}
                >
                  <SelectTrigger
                    className="w-[140px]"
                    aria-label={t("appPage.profile.notifications.digestHour.title")}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIGEST_HOURS_UTC.map((hour) => (
                      <SelectItem key={hour} value={String(hour)}>
                        {formatHourUtc(hour)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )
        )}
      </div>
    </section>
  );
};
