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
import type { EmailLocale, NotificationPreferences } from "@/lib/api-notification-preferences";
import { useDateFormat } from "@/lib/date-format";
import { queryKeys } from "@/lib/queryKeys";

const DIGEST_HOURS_UTC = Array.from({ length: 24 }, (_, hour) => hour);

// Each language is named in itself, whatever the dashboard's own locale: that
// is how a user who landed on the wrong one can still find theirs.
const EMAIL_LOCALES: { value: EmailLocale; label: string }[] = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
];

// The stored value stays a UTC hour (what the backend schedules on); only the
// label is shown in the browser's local time.
const toLocalHourDate = (hour: number) => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hour));
};

/**
 * Lets a user opt in/out of the daily alert digest, per channel (email
 * and/or push — charge-points-server ADR 0023), pick their own send hour
 * (shown in local time, stored as UTC), overriding charge-points-server's global default hour (ADR 0018
 * there), and choose the language of every email the backend sends them
 * (ADR 0022 there). Every field defaults to the backend's own resolved
 * default — this panel never invents a client-side fallback for a user who
 * has not set anything yet.
 *
 * `isPushSubscribed` comes from the separate browser-level push card further
 * down this page (`usePushSubscription`, owned by `ProfilePage`): turning on
 * the digest's push channel is meaningless without a live subscription to
 * send it to, so that toggle stays disabled until one exists, rather than
 * silently accepting a preference this browser can never receive.
 */
export const NotificationPreferencesPanel = ({
  isPushSubscribed,
}: {
  isPushSubscribed: boolean;
}) => {
  const t = useTranslations("");
  const { formatTime } = useDateFormat();
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
                    {t("appPage.profile.notifications.digestEmailEnabled.title")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t("appPage.profile.notifications.digestEmailEnabled.description")}
                  </span>
                </div>
                <Switch
                  checked={preferences.digestEmailEnabled}
                  disabled={saving}
                  onCheckedChange={(checked) =>
                    updateMutation.mutate({ digestEmailEnabled: checked })
                  }
                  aria-label={t("appPage.profile.notifications.digestEmailEnabled.title")}
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm">
                    {t("appPage.profile.notifications.digestPushEnabled.title")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {isPushSubscribed
                      ? t("appPage.profile.notifications.digestPushEnabled.description")
                      : t("appPage.profile.notifications.digestPushEnabled.requiresSubscription")}
                  </span>
                </div>
                <Switch
                  checked={preferences.digestPushEnabled}
                  disabled={!isPushSubscribed || saving}
                  onCheckedChange={(checked) =>
                    updateMutation.mutate({ digestPushEnabled: checked })
                  }
                  aria-label={t("appPage.profile.notifications.digestPushEnabled.title")}
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
                  disabled={
                    (!preferences.digestEmailEnabled && !preferences.digestPushEnabled) || saving
                  }
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
                        {formatTime(toLocalHourDate(hour))}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm">{t("appPage.profile.notifications.locale.title")}</span>
                  <span className="text-xs text-muted-foreground">
                    {t("appPage.profile.notifications.locale.description")}
                  </span>
                </div>
                <Select
                  value={preferences.locale}
                  disabled={saving}
                  onValueChange={(value) => updateMutation.mutate({ locale: value as EmailLocale })}
                >
                  <SelectTrigger
                    className="w-[140px]"
                    aria-label={t("appPage.profile.notifications.locale.title")}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EMAIL_LOCALES.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
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
