import type {
  NotificationLocale,
  NotificationPreferences,
  UpdateNotificationPreferences,
} from "@watchborne/charge-points-types";

import { withErrorLogging } from "./api-error-wrapper";
import { httpClient } from "./http-client";

export type { NotificationPreferences };

// The effective preferences and their partial update (shared types).
// `digestHour` and `locale` are always resolved by the backend; an update may
// send `locale: null` to revert to the default. The email and push digest
// toggles are independent; `digestHour` applies to both.
export type EmailLocale = NotificationLocale;

export type NotificationPreferencesUpdate = UpdateNotificationPreferences;

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
