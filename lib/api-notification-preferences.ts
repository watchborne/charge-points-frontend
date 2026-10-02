import { withErrorLogging } from "./api-error-wrapper";
import { httpClient } from "./http-client";

// The effective preference charge-points-server's
// /api/me/notification-preferences route returns — not a domain entity, so
// it isn't part of @watchborne/charge-points-types (same reasoning as
// lib/api-me.ts's `Me`). `digestHourUtc` is always a resolved 0-23 value:
// the backend already substitutes its own global default when the caller
// has never set one, so this client never needs to know about that fallback.
export type NotificationPreferences = {
  digestEnabled: boolean;
  digestHourUtc: number;
};

export type NotificationPreferencesUpdate = Partial<NotificationPreferences>;

export const notificationPreferencesApis = {
  getPreferences: async function (): Promise<NotificationPreferences> {
    return withErrorLogging(
      () => httpClient.get<NotificationPreferences>("/api/me/notification-preferences"),
      "NotificationPreferences.getPreferences",
    );
  },

  updatePreferences: async function (
    update: NotificationPreferencesUpdate,
  ): Promise<NotificationPreferences> {
    return withErrorLogging(
      () => httpClient.patch<NotificationPreferences>("/api/me/notification-preferences", update),
      "NotificationPreferences.updatePreferences",
    );
  },
};
