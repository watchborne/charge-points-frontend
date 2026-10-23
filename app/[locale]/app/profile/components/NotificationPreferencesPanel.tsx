"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Callout, Skeleton, Switch } from "@watchborne/electrons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@watchborne/electrons";
import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { api } from "@/lib/api";
import type { EmailLocale, NotificationPreferences } from "@/lib/api-notification-preferences";
import { queryKeys } from "@/lib/queryKeys";

// The digest hour is a Europe/Paris hour, shown and stored as is, so it holds
// whatever the device's time zone and across DST changes.
const DIGEST_HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const formatDigestHour = (hour: number) => `${String(hour).padStart(2, "0")}:00`;

// Each language is named in itself, so a user on the wrong locale finds theirs.
const EMAIL_LOCALES: { value: EmailLocale; label: string }[] = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
];

/**
 * The daily alert digest per channel (email, push), its send hour, and the
 * language of the emails the backend sends. Every field shows the backend's
 * resolved value; no client-side fallback.
 *
 * The push toggle stays disabled without a live browser subscription
 * (`isPushSubscribed`). The browser-level control is passed as `children` and
 * rendered first, in the same card.
 */
export const NotificationPreferencesPanel = ({
  isPushSubscribed,
  children,
}: {
  isPushSubscribed: boolean;
  children?: ReactNode;
}) => {
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
        {children && <div className="border-b pb-4">{children}</div>}

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
                  value={String(preferences.digestHour)}
                  disabled={
                    (!preferences.digestEmailEnabled && !preferences.digestPushEnabled) || saving
                  }
                  onValueChange={(value) => updateMutation.mutate({ digestHour: Number(value) })}
                >
                  <SelectTrigger
                    className="w-[140px]"
                    aria-label={t("appPage.profile.notifications.digestHour.title")}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIGEST_HOURS.map((hour) => (
                      <SelectItem key={hour} value={String(hour)}>
                        {formatDigestHour(hour)}
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
